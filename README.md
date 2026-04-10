# AI Chatbot

## What I Built
A fully functional AI chatbot with a **Node.js Express backend** and a **vanilla JavaScript frontend**. The backend proxies all AI API calls, keeping the API key secure and server-side. The frontend maintains full conversation context so the AI remembers what was said earlier in the session.

---

## API and Model

**API:** [OpenRouter](https://openrouter.ai)  
**Model:** `openai/gpt-4o-mini`  

OpenRouter provides a single API key that works across multiple AI providers (OpenAI, Anthropic, Google, Meta). I chose `gpt-4o-mini` because it offers an excellent balance of speed, quality, and cost — fast enough for real-time chat, smart enough for meaningful conversations.

---

## Three Required Questions

### Question 1 — API and Model
I used the **OpenRouter API** with the **`openai/gpt-4o-mini`** model. OpenRouter acts as a unified gateway to multiple AI providers, and GPT-4o-mini provides fast, high-quality responses suitable for a chatbot.

### Question 2 — Why Backend, Not Frontend?
The API call is made from the backend because **API keys embedded in frontend JavaScript are visible to anyone who opens browser DevTools** (Network tab or Sources panel). An attacker could copy the key and use it to make unlimited API calls at your expense, or abuse it for malicious purposes. A backend proxy keeps the key in `process.env` on the server — it never leaves the server and is never sent to the browser.

### Question 3 — Fallback Provider
If OpenRouter runs out of credits, I would switch to **Google Gemini API** (free tier, no payment required). Two things would change in `server.js`:
1. **Base URL:** Change from `https://openrouter.ai/api/v1/chat/completions` to `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`
2. **Model name:** Change from `openai/gpt-4o-mini` to `gemini-2.0-flash`

The rest of the code (request format, headers, response parsing) stays identical because Gemini supports the OpenAI-compatible format.

---

## Live Deployment

**Frontend:** `https://your-app.netlify.app` *(update after deploying)*  
**Backend:** `https://your-api.onrender.com` *(update after deploying)*

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML, CSS, JavaScript |
| Backend | Node.js, Express.js |
| AI API | OpenRouter (OpenAI-compatible) |
| Styling | Custom CSS with glassmorphism, dark theme |
| Deployment | Render (backend) + Netlify (frontend) |

---

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- An OpenRouter API key from [openrouter.ai](https://openrouter.ai)

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd ai-chatbot
cd backend
npm install
```

### 2. Configure Environment
```bash
# Copy the example env file
cp .env.example .env

# Edit .env and paste your real API key
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
```

### 3. Start the Backend
```bash
npm start
# Server runs on http://localhost:3000
```

### 4. Open the Frontend
Open `frontend/index.html` in your browser (or use VS Code Live Server).

### 5. Test Context
1. Ask: **"What is JavaScript?"** → get a response
2. Follow up: **"Can you give me an example of that?"** → the AI should respond with a JavaScript example (not ask "example of what?")

If the second reply is context-aware, conversation history is working correctly.

---

## Security

- ✅ API key stored in `.env` (server-side only)
- ✅ `.env` is in `.gitignore` (never committed)
- ✅ Frontend only talks to the backend — never directly to OpenRouter
- ✅ No API key anywhere in frontend code
- ✅ CORS enabled for cross-origin frontend requests

---

## Project Structure

```
├── backend/
│   ├── server.js        # Express server + /chat route
│   ├── package.json     # Dependencies
│   ├── .env             # Real API key (gitignored)
│   ├── .env.example     # Placeholder keys (committed)
│   └── .gitignore
├── frontend/
│   ├── index.html       # Chat UI
│   ├── style.css        # Premium dark theme
│   └── script.js        # Chat logic + context management
├── .gitignore
└── README.md
```
