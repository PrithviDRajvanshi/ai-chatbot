// ============================================================
// AI Chatbot Backend — Express Server
// Proxies chat requests to OpenRouter API
// API key is read from .env — NEVER exposed to the frontend
// ============================================================

const express = require("express");
const cors = require("cors");
const path = require("path");

// Load environment variables from .env file
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────
app.use(cors()); // Allow cross-origin requests from frontend
app.use(express.json()); // Parse JSON request bodies

// ── Serve Frontend Static Files ─────────────────────────────
// Serves the frontend/ directory so the UI is accessible at the root URL
app.use(express.static(path.join(__dirname, "..", "frontend")));

// ── Health Check ────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    message: "AI Chatbot backend is running. POST to /chat to talk.",
  });
});

// ── Chat Route ──────────────────────────────────────────────
// Accepts: POST { messages: [{ role, content }, ...] }
// Returns: { reply: "..." }
// The frontend sends the FULL conversation history with every
// request so the AI model can maintain context.
// ─────────────────────────────────────────────────────────────
app.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    // Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Invalid request. Send { messages: [{ role, content }] }",
      });
    }

    // Read the API key from environment — NEVER hardcode this
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error("❌ OPENROUTER_API_KEY is not set in .env");
      return res.status(500).json({
        error: "Server misconfiguration: API key not found.",
      });
    }

    // Prepend a system message to give the AI a personality
    const systemMessage = {
      role: "system",
      content:
        "You are a helpful, friendly, and concise AI assistant. You remember the full conversation and refer back to earlier messages when relevant. Keep responses clear and well-structured. Use markdown formatting when it helps readability.",
    };

    // Call OpenRouter API
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://ai-chatbot-project.netlify.app",
          "X-Title": "AI Chatbot Project",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [systemMessage, ...messages],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      }
    );

    // Handle API errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ OpenRouter API error:", response.status, errorData);
      return res.status(response.status).json({
        error: `AI API returned ${response.status}: ${errorData?.error?.message || "Unknown error"}`,
      });
    }

    const data = await response.json();

    // Extract the assistant's reply
    const reply =
      data.choices?.[0]?.message?.content || "Sorry, I could not generate a response.";

    res.json({ reply });
  } catch (error) {
    console.error("❌ Server error:", error.message);
    res.status(500).json({
      error: "Internal server error. Please try again.",
    });
  }
});

// ── Start Server ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🤖 AI Chatbot backend running on http://localhost:${PORT}`);
  console.log(`   POST /chat to send messages\n`);
});
