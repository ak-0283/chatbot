document.addEventListener("DOMContentLoaded", () => {
  const chatToggle = document.getElementById("chat-toggle");
  const chatContainer = document.getElementById("chat-container");
  const closeChat = document.getElementById("close-chat");
  const sendBtn = document.getElementById("send-btn");
  const userInput = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");

  chatToggle.addEventListener("click", () => {
    chatContainer.classList.toggle("hidden");
    userInput.focus();
  });

  closeChat.addEventListener("click", () => {
    chatContainer.classList.add("hidden");
  });

  function appendMessage(sender, text) {
    const row = document.createElement("div");
    row.className = `row ${sender}`;

    const bubble = document.createElement("div");
    bubble.className = `msg ${sender}`;
    bubble.textContent = text;

    row.appendChild(bubble);
    chatBox.appendChild(row);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  let typingEl = null;
  function showTyping() {
    if (typingEl) return;
    typingEl = document.createElement("div");
    typingEl.className = "row bot";
    const b = document.createElement("div");
    b.className = "msg bot";
    b.textContent = "…";
    typingEl.appendChild(b);
    chatBox.appendChild(typingEl);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
  function hideTyping() {
    if (typingEl) {
      typingEl.remove();
      typingEl = null;
    }
  }

  async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    appendMessage("user", text);
    userInput.value = "";
    showTyping();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });

      // Safe JSON parsing
      const contentType = res.headers.get("content-type") || "";
      let data = null;
      if (contentType.toLowerCase().includes("application/json")) {
        try { data = await res.json(); } catch {}
      } else {
        const raw = await res.text();
        hideTyping();
        appendMessage("bot", `❌ Server returned non-JSON response.\n\nSnippet:\n${raw.slice(0,200)}`);
        return;
      }

      hideTyping();
      if (res.ok) {
        appendMessage("bot", data.reply || "⚠️ No response from server.");
      } else {
        appendMessage("bot", `❌ Error: ${data.error || "Unknown error"}`);
      }

    } catch (err) {
      hideTyping();
      appendMessage("bot", "❌ Network error: " + err.message);
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
});
