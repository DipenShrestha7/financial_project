# Nepal Finance Desk chatbot

The chatbot is a small Python service called by the Node.js backend. The request flow is:

`React frontend -> Node.js backend -> Python LangGraph service -> Node.js backend -> PostgreSQL`

The Node.js backend writes the user message and assistant response in one database
transaction only after the Python service returns successfully. The Python service does
not receive website user data or connect to the application database.

For market-data prompts, the LangGraph workflow queries the local NEPSE API first
(`NEPSE_API_URL`, default `http://127.0.0.1:8000`). It uses `/PriceVolume` for current
prices and `/LiveMarket` for live-market prompts. Tavily is used for news, announcements,
and external context, or as a fallback if the local API cannot be reached.

## Run locally

From the repository root, set these values in the global `.env`:

```env
OPENROUTER_API_KEY=your_openrouter_key
TAVILY_API_KEY=your_tavily_key
OPENROUTER_MODEL=openrouter/free
CHATBOT_API_URL=http://127.0.0.1:8002
NEPSE_API_URL=http://127.0.0.1:8000
```

Create and activate your virtual environment in this folder, then install:

```powershell
cd chatbot
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8002
```

Start the Node.js backend separately with its normal command.
