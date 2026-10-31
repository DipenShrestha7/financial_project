import asyncio
from typing import TypedDict

import httpx
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph
from tavily import TavilyClient

SYSTEM_PROMPT = """You are Nepal Finance Desk, an accurate assistant for Nepal's NEPSE,
Nepalese banks, Nepal Rastra Bank, listed companies, market regulations, and related
public financial news. Answer only questions in those areas. If a question is unrelated,
politely explain that you only cover NEPSE and Nepal banking.

Use the supplied web results as your source of truth. Clearly distinguish facts from
analysis, include the relevant date, and never invent prices, rates, announcements, or
citations. Do not ask for or use personal information, bank account data, portfolio data,
passwords, or any private website data. This is general information, not financial advice.
Format answers with a concise summary, useful bullet points, and a Sources section when
web or local API results are available. For local NEPSE results, report the exact
lastUpdatedDateTime when present and call the value the latest available local data.
Never describe local data as live or real-time unless its timestamp supports that."""

FINANCE_TERMS = (
    "nepse", "stock", "share", "ipo", "fpo", "dividend", "bank", "banking",
    "loan", "deposit", "interest rate", "nepal rastra bank", "nrb", "sebon",
    "hydropower", "mutual fund", "capital market", "financial", "शेयर", "बैंक", "सेयर",
)
SEARCH_TERMS = (
    "latest", "current", "today", "yesterday", "recent", "news", "update",
    "price", "rate", "quote", "market", "index", "announcement", "result",
    "dividend", "ipo", "fpo", "earnings", "close", "trading", "forecast",
    "भाउ", "मूल्य", "आज", "नयाँ", "समाचार",
)
MARKET_TERMS = (
    "price", "ltp", "quote", "live", "current", "today", "market status",
    "open", "close", "gainer", "loser", "turnover", "volume", "index",
    "भाउ", "मूल्य", "आज", "बजार",
)
NEWS_TERMS = (
    "news", "announcement", "update", "ipo", "fpo", "dividend", "earnings",
    "policy", "recent", "yesterday", "forecast", "समाचार", "नयाँ",
)


class ChatState(TypedDict):
    question: str
    history: list[dict[str, str]]
    should_search: bool
    needs_market_data: bool
    local_results: list[dict]
    search_results: list[dict]
    answer: str


def build_graph(
    openrouter_api_key: str,
    tavily_api_key: str,
    model_name: str,
    nepse_api_url: str,
):
    llm = (
        ChatOpenAI(
            model=model_name,
            api_key=openrouter_api_key,
            base_url="https://openrouter.ai/api/v1",
            temperature=0.1,
            default_headers={
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "Nepal Finance Desk",
            },
        )
        if openrouter_api_key
        else None
    )
    tavily = TavilyClient(api_key=tavily_api_key) if tavily_api_key else None

    async def retrieve(state: ChatState) -> dict:
        question = state["question"].lower()
        local_results: list[dict] = []
        search_results: list[dict] = []

        if state["needs_market_data"]:
            if "status" in question or "open" in question or "closed" in question:
                endpoint = "IsNepseOpen"
            elif "gainer" in question:
                endpoint = "TopGainers"
            elif "loser" in question:
                endpoint = "TopLosers"
            elif "index" in question:
                endpoint = "NepseIndex"
            elif "summary" in question or "turnover" in question:
                endpoint = "Summary"
            else:
                endpoint = "LiveMarket" if "live" in question else "PriceVolume"
            try:
                async with httpx.AsyncClient(timeout=12) as client:
                    response = await client.get(f"{nepse_api_url.rstrip('/')}/{endpoint}")
                    response.raise_for_status()
                    data = response.json()
                local_results.append(
                    {
                        "title": f"Local NEPSE API - {endpoint}",
                        "url": f"{nepse_api_url.rstrip('/')}/{endpoint}",
                        "content": (
                            "This is the latest response from the local NEPSE API. "
                            "Use any lastUpdatedDateTime field as the data timestamp. "
                            f"Data: {str(data)[:24000]}"
                        ),
                    }
                )
            except (httpx.HTTPError, ValueError) as error:
                local_results.append(
                    {
                        "title": "Local NEPSE API unavailable",
                        "url": nepse_api_url,
                        "content": f"The local NEPSE API could not be reached: {error}",
                    }
                )

        local_available = bool(local_results and "unavailable" not in local_results[0]["title"])
        needs_web = (
            state["should_search"]
            and (not state["needs_market_data"] or not local_available
                 or any(term in question for term in NEWS_TERMS))
        )
        if needs_web and tavily:
            results = await asyncio.to_thread(
                tavily.search,
                query=f"{state['question']} Nepal NEPSE banking",
                search_depth="advanced",
                max_results=5,
                include_answer=False,
            )
            search_results = results.get("results", [])
        return {"local_results": local_results, "search_results": search_results}

    def answer(state: ChatState) -> dict:
        context = "\n\n".join(
            f"TITLE: {item.get('title', '')}\nURL: {item.get('url', '')}\n"
            f"CONTENT: {item.get('content', '')}"
            for item in state["local_results"] + state["search_results"]
        )
        messages = [SystemMessage(content=SYSTEM_PROMPT)]
        for item in state["history"][-6:]:
            message_type = AIMessage if item.get("role") == "assistant" else HumanMessage
            messages.append(message_type(content=item["content"]))
        messages.append(
            HumanMessage(
                content=f"Question: {state['question']}\n\nWeb results:\n"
                f"{context or 'No web results were returned.'}"
            )
        )
        if llm is None:
            if state["local_results"]:
                return {
                    "answer": (
                        "Here is the latest data returned by the local NEPSE API. "
                        "The raw response is shown because OPENROUTER_API_KEY is not configured:\n\n"
                        f"{context}"
                    )
                }
            raise RuntimeError(
                "OPENROUTER_API_KEY is not configured. Add it to the root .env "
                "to answer general finance questions."
            )
        response = llm.invoke(messages)
        return {
            "answer": response.content
            if isinstance(response.content, str)
            else str(response.content)
        }

    workflow = StateGraph(ChatState)
    workflow.add_node("retrieve", retrieve)
    workflow.add_node("answer", answer)
    workflow.add_edge(START, "retrieve")
    workflow.add_edge("retrieve", "answer")
    workflow.add_edge("answer", END)
    return workflow.compile()
