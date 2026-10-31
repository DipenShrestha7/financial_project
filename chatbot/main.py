from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from config import settings
from graph import FINANCE_TERMS, MARKET_TERMS, SEARCH_TERMS, build_graph

config = settings()
graph = build_graph(
    config["openrouter_api_key"],
    config["tavily_api_key"],
    config["openrouter_model"],
    config["nepse_api_url"],
)

app = FastAPI(title="Nepal Finance Desk")


class MessageRequest(BaseModel):
    session_id: str
    message: str = Field(min_length=2, max_length=2000)
    history: list[dict[str, str]] = Field(default_factory=list, max_length=12)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "nepse_api_url": config["nepse_api_url"],
        "model": config["openrouter_model"],
        "openrouter_configured": bool(config["openrouter_api_key"]),
        "tavily_configured": bool(config["tavily_api_key"]),
    }


@app.post("/chat")
async def chat(request: MessageRequest):
    question = request.message.strip()
    normalized = question.lower()
    should_search = (
        any(term in normalized for term in FINANCE_TERMS)
        and any(term in normalized for term in SEARCH_TERMS)
    )
    needs_market_data = any(term in normalized for term in MARKET_TERMS)
    try:
        result = await graph.ainvoke(
            {
                "question": question,
                "history": request.history,
                "should_search": should_search,
                "needs_market_data": needs_market_data,
                "local_results": [],
                "search_results": [],
                "answer": "",
            }
        )
    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail="The public finance search service is temporarily unavailable.",
        ) from error

    sources = [
        {"title": item.get("title", "Source"), "url": item["url"]}
        for item in result.get("local_results", []) + result.get("search_results", [])
        if item.get("url")
    ]
    return {"session_id": request.session_id, "answer": result["answer"], "sources": sources}
