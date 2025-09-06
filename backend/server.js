import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// Chat API
app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = (req.body.message || "").toString().trim();
    if (!userMessage) return res.status(400).json({ error: "Message is required" });

    // Call Groq API
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: userMessage }]
      })
    });

    // Read response as text first
    const raw = await response.text();

    // Try parsing JSON
    let data = null;
    try { data = JSON.parse(raw); } catch {}

    if (!data) {
      return res.status(502).json({
        error: "Groq returned non-JSON response",
        snippet: raw.slice(0, 400)
      });
    }

    if (!response.ok || data.error) {
      return res.status(502).json({
        error: data.error || "Groq API error",
        status: response.status
      });
    }

    const reply = data?.choices?.[0]?.message?.content || "⚠️ No reply received.";
    res.json({ reply });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
