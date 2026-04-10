// ============================================================
// AI Chatbot — Frontend Logic
// Manages conversation context and communicates with backend
// NEVER contacts the AI API directly — all calls go through
// the backend at /chat
// ============================================================

// ── Configuration ───────────────────────────────────────────
// Change this to your deployed backend URL before deploying frontend separately
// When frontend is served from the same server, use relative path:
const API_URL = "/chat";

// ── State ───────────────────────────────────────────────────
// This array holds the FULL conversation history.
// Every message the user sends AND every AI response is stored here.
// The entire array is sent to the backend with each request so the
// AI model can maintain context across the conversation.
let messages = [];
let isLoading = false;

// ── DOM Elements ────────────────────────────────────────────
const chatMessages = document.getElementById("chatMessages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const welcomeCard = document.getElementById("welcomeCard");
const headerStatus = document.getElementById("headerStatus");

// ── Initialize ──────────────────────────────────────────────
function init() {
  // Send button click
  sendBtn.addEventListener("click", handleSend);

  // Enter key (Shift+Enter for newline)
  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // Auto-resize textarea
  messageInput.addEventListener("input", autoResize);

  // Clear conversation
  clearBtn.addEventListener("click", clearConversation);

  // Suggestion chips
  document.querySelectorAll(".suggestion-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const msg = chip.getAttribute("data-message");
      messageInput.value = msg;
      handleSend();
    });
  });

  // Focus input on load
  messageInput.focus();
}

// ── Auto-resize Textarea ────────────────────────────────────
function autoResize() {
  messageInput.style.height = "auto";
  messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + "px";
}

// ── Handle Send Message ─────────────────────────────────────
async function handleSend() {
  const content = messageInput.value.trim();
  if (!content || isLoading) return;

  // Hide welcome card on first message
  if (welcomeCard) {
    welcomeCard.style.display = "none";
  }

  // 1. Add user message to the conversation history
  messages.push({ role: "user", content });

  // 2. Render user message in the UI
  renderMessage("user", content);

  // 3. Clear input and reset height
  messageInput.value = "";
  messageInput.style.height = "auto";
  messageInput.focus();

  // 4. Show typing indicator
  showTypingIndicator();
  setLoading(true);

  try {
    // 5. Send the FULL message history to the backend
    //    This is what enables conversation context — the AI sees
    //    every previous message, not just the latest one.
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const data = await response.json();

    // 6. Add the AI response to conversation history
    messages.push({ role: "assistant", content: data.reply });

    // 7. Remove typing indicator and render the response
    removeTypingIndicator();
    renderMessage("assistant", data.reply);
  } catch (error) {
    console.error("Chat error:", error);
    removeTypingIndicator();
    renderError(error.message || "Failed to connect to the server. Is the backend running?");
  } finally {
    setLoading(false);
  }
}

// ── Render a Message ────────────────────────────────────────
function renderMessage(role, content) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message message--${role}`;

  const avatar = document.createElement("div");
  avatar.className = "message__avatar";
  avatar.textContent = role === "user" ? "Y" : "🤖";

  const bubble = document.createElement("div");
  bubble.className = "message__bubble";

  if (role === "assistant") {
    // Parse basic markdown for assistant messages
    bubble.innerHTML = parseMarkdown(content);
  } else {
    bubble.textContent = content;
  }

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(bubble);
  chatMessages.appendChild(messageDiv);
  scrollToBottom();
}

// ── Basic Markdown Parser ───────────────────────────────────
function parseMarkdown(text) {
  // Escape HTML first to prevent XSS
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks (```...```)
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });

  // Inline code (`...`)
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Bold (**...**)
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // Italic (*...*)
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");

  // Line breaks
  html = html.replace(/\n/g, "<br>");

  return html;
}

// ── Error Message ───────────────────────────────────────────
function renderError(text) {
  const messageDiv = document.createElement("div");
  messageDiv.className = "message message--error message--assistant";

  const avatar = document.createElement("div");
  avatar.className = "message__avatar";
  avatar.textContent = "⚠️";

  const bubble = document.createElement("div");
  bubble.className = "message__bubble";
  bubble.textContent = text;

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(bubble);
  chatMessages.appendChild(messageDiv);
  scrollToBottom();
}

// ── Typing Indicator ────────────────────────────────────────
function showTypingIndicator() {
  const indicator = document.createElement("div");
  indicator.className = "typing-indicator";
  indicator.id = "typingIndicator";

  indicator.innerHTML = `
    <div class="message__avatar">🤖</div>
    <div class="typing-indicator__dots">
      <span class="typing-indicator__dot"></span>
      <span class="typing-indicator__dot"></span>
      <span class="typing-indicator__dot"></span>
    </div>
  `;

  chatMessages.appendChild(indicator);
  scrollToBottom();
}

function removeTypingIndicator() {
  const indicator = document.getElementById("typingIndicator");
  if (indicator) indicator.remove();
}

// ── Loading State ───────────────────────────────────────────
function setLoading(loading) {
  isLoading = loading;
  sendBtn.disabled = loading;
  messageInput.disabled = loading;

  if (!loading) {
    messageInput.focus();
  }
}

// ── Clear Conversation ──────────────────────────────────────
function clearConversation() {
  messages = [];

  // Remove all messages but keep the welcome card
  chatMessages.innerHTML = "";

  // Re-create welcome card
  const card = document.createElement("div");
  card.className = "welcome-card";
  card.id = "welcomeCard";
  card.innerHTML = `
    <div class="welcome-card__icon">🤖</div>
    <h2>Welcome!</h2>
    <p>I'm your AI assistant. Ask me anything — I'll remember our entire conversation.</p>
    <div class="welcome-card__suggestions">
      <button class="suggestion-chip" data-message="What is JavaScript?">What is JavaScript?</button>
      <button class="suggestion-chip" data-message="Explain REST APIs in simple terms">Explain REST APIs</button>
      <button class="suggestion-chip" data-message="Write a short poem about coding">Write a poem</button>
    </div>
  `;
  chatMessages.appendChild(card);

  // Re-bind suggestion chip listeners
  card.querySelectorAll(".suggestion-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const msg = chip.getAttribute("data-message");
      messageInput.value = msg;
      handleSend();
    });
  });

  messageInput.focus();
}

// ── Scroll to Bottom ────────────────────────────────────────
function scrollToBottom() {
  requestAnimationFrame(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

// ── Start ───────────────────────────────────────────────────
init();
