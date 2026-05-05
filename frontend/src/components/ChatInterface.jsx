import { useEffect, useRef, useState } from "react";
import SourceContext from "./SourceContext";
import { API_BASE } from "../App";

const SYMBOLS = [
  "🩺","❤️","🌿","✨","🩻","💊","🛡️","☀️","💙","🌱",
  "🤝","⭐","🩹","🌸","💚","🔬","🌈","🫶","💡","🧬",
  "🌙","🦋","🏥","💫","🌻","🕊️",
];

const QUOTES = [
  "You deserve to understand your coverage",
  "Healthcare clarity is self-care",
  "You've got this. We've got you.",
  "Knowledge is your best coverage",
  "No question is too small",
  "Your health, your terms",
  "Peace of mind starts here",
  "You are not alone in this",
];

const rand = (min, max) => Math.random() * (max - min) + min;

export default function ChatInterface({ docId, messages, setMessages }) {
  const [input, setInput] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const bgRef = useRef(null);

  useEffect(() => {
    const el = bgRef.current;
    if (!el) return;
    el.innerHTML = "";

    // Symbols
    for (let i = 0; i < 28; i++) {
      const span = document.createElement("span");
      span.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      const rot = rand(-20, 20);
      span.style.cssText = [
        "position:absolute",
        `left:${rand(2, 92)}%`,
        `top:${rand(3, 90)}%`,
        `font-size:${rand(16, 34)}px`,
        "opacity:0",
        `animation:floatFade ${rand(8, 18).toFixed(1)}s ease-in-out ${(-rand(0, 14)).toFixed(1)}s infinite`,
        "pointer-events:none",
        "user-select:none",
      ].join(";");
      span.style.setProperty("--peak", rand(0.04, 0.11).toFixed(3));
      span.style.setProperty("--rot", `${rot.toFixed(1)}deg`);
      span.style.setProperty("--rot-end", `${(rot + rand(-5, 5)).toFixed(1)}deg`);
      el.appendChild(span);
    }

    // Quotes
    QUOTES.forEach((text) => {
      const span = document.createElement("span");
      span.textContent = text;
      const rot = rand(-20, 20);
      span.style.cssText = [
        "position:absolute",
        `left:${rand(2, 92)}%`,
        `top:${rand(3, 90)}%`,
        "font-size:10.5px",
        "font-family:var(--font-display)",
        "color:rgba(0,201,167,0.9)",
        "white-space:nowrap",
        "opacity:0",
        `animation:floatFade ${rand(14, 22).toFixed(1)}s ease-in-out ${(-rand(0, 18)).toFixed(1)}s infinite`,
        "pointer-events:none",
        "user-select:none",
      ].join(";");
      span.style.setProperty("--peak", rand(0.04, 0.08).toFixed(3));
      span.style.setProperty("--rot", `${rot.toFixed(1)}deg`);
      span.style.setProperty("--rot-end", `${(rot + rand(-5, 5)).toFixed(1)}deg`);
      el.appendChild(span);
    });
  }, []);

  const isDisabled = !docId;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const question = input.trim();
    if (!question || isAsking || !docId) return;

    const userMsg = { role: "user", text: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsAsking(true);

    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, doc_id: docId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to get an answer");
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.answer, sources: data.sources },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "error", text: err.message },
      ]);
    } finally {
      setIsAsking(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div style={styles.container}>
      <div className="chat-bg" ref={bgRef} style={styles.chatBg} />
      <div style={styles.titleBar}>
        <span style={styles.titleIcon}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </span>
        Policy Q&A
      </div>

      <div style={styles.messages}>
        {messages.length === 0 && (
          <div style={styles.emptyState}>
            {isDisabled ? (
              <>
                <div style={styles.emptyIcon}>📄</div>
                <div style={styles.emptyTitle}>Upload a policy to start asking questions</div>
                <div style={styles.emptySubtitle}>
                  Once a PDF is analyzed, you can ask anything about your coverage
                </div>
              </>
            ) : (
              <>
                <div style={styles.emptyIcon}>💬</div>
                <div style={styles.emptyTitle}>Ask about your policy</div>
                <div style={styles.emptySubtitle}>
                  Try: "What is my deductible?" or "Is mental health covered?"
                </div>
              </>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={styles.messageWrapper} className="fade-in">
            {msg.role === "user" && (
              <div style={styles.userRow}>
                <div style={styles.userBubble}>{msg.text}</div>
              </div>
            )}
            {msg.role === "assistant" && (
              <div style={styles.assistantRow}>
                <div style={styles.assistantAvatar}>AI</div>
                <div style={styles.assistantContent}>
                  <div style={styles.assistantBubble}>{msg.text}</div>
                  <SourceContext sources={msg.sources} />
                </div>
              </div>
            )}
            {msg.role === "error" && (
              <div style={styles.errorMsg}>
                <span style={styles.errorIcon}>!</span>
                {msg.text}
              </div>
            )}
          </div>
        ))}

        {isAsking && (
          <div style={styles.assistantRow} className="fade-in">
            <div style={styles.assistantAvatar}>AI</div>
            <div style={styles.thinkingBubble}>
              <span style={{ ...styles.dot, animationDelay: "0ms" }} />
              <span style={{ ...styles.dot, animationDelay: "150ms" }} />
              <span style={{ ...styles.dot, animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div style={{ ...styles.inputArea, ...(isDisabled ? styles.inputDisabled : {}) }}>
        <textarea
          ref={inputRef}
          style={styles.textarea}
          placeholder={isDisabled ? "Upload a policy to start asking questions…" : "Ask a question about your policy…"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isDisabled || isAsking}
          rows={1}
        />
        <button
          style={{
            ...styles.sendBtn,
            ...(isDisabled || isAsking || !input.trim() ? styles.sendBtnDisabled : {}),
          }}
          onClick={sendMessage}
          disabled={isDisabled || isAsking || !input.trim()}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
    position: "relative",
  },
  chatBg: {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    zIndex: 0,
  },
  titleBar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "14px 20px",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text-secondary)",
    borderBottom: "1px solid var(--border)",
    flexShrink: 0,
    letterSpacing: "0.3px",
    position: "relative",
    zIndex: 1,
  },
  titleIcon: {
    color: "var(--accent)",
    display: "flex",
    alignItems: "center",
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    position: "relative",
    zIndex: 1,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    textAlign: "center",
    padding: "60px 40px",
    gap: 10,
    color: "var(--text-secondary)",
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: "var(--text-primary)",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "var(--text-secondary)",
    maxWidth: 320,
    lineHeight: 1.6,
  },
  messageWrapper: {},
  userRow: {
    display: "flex",
    justifyContent: "flex-end",
  },
  userBubble: {
    maxWidth: "72%",
    backgroundColor: "var(--accent)",
    color: "#0a1628",
    borderRadius: "14px 14px 2px 14px",
    padding: "10px 14px",
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 1.5,
    wordBreak: "break-word",
  },
  assistantRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
  },
  assistantAvatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    backgroundColor: "var(--bg-card)",
    border: "1px solid var(--border-accent)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    fontWeight: 700,
    color: "var(--accent)",
    flexShrink: 0,
    letterSpacing: "0.5px",
  },
  assistantContent: {
    flex: 1,
    minWidth: 0,
  },
  assistantBubble: {
    backgroundColor: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "2px 14px 14px 14px",
    padding: "10px 14px",
    fontSize: 14,
    lineHeight: 1.65,
    color: "var(--text-primary)",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  thinkingBubble: {
    backgroundColor: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "2px 14px 14px 14px",
    padding: "12px 16px",
    display: "flex",
    gap: 5,
    alignItems: "center",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    backgroundColor: "var(--text-muted)",
    display: "inline-block",
    animation: "pulse 1.2s ease infinite",
  },
  errorMsg: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    borderRadius: "var(--radius-sm)",
    backgroundColor: "rgba(255, 107, 107, 0.08)",
    border: "1px solid rgba(255, 107, 107, 0.2)",
    color: "var(--danger)",
    fontSize: 13,
  },
  errorIcon: {
    fontWeight: 700,
    flexShrink: 0,
  },
  inputArea: {
    display: "flex",
    alignItems: "flex-end",
    gap: 10,
    padding: "14px 20px",
    borderTop: "1px solid var(--border)",
    backgroundColor: "var(--bg-secondary)",
    flexShrink: 0,
    position: "relative",
    zIndex: 1,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  textarea: {
    flex: 1,
    backgroundColor: "var(--bg-input)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    color: "var(--text-primary)",
    fontFamily: "var(--font-body)",
    fontSize: 14,
    padding: "10px 14px",
    resize: "none",
    outline: "none",
    lineHeight: 1.5,
    minHeight: 42,
    maxHeight: 120,
    overflow: "auto",
    transition: "border-color var(--transition)",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: "var(--radius)",
    backgroundColor: "var(--accent)",
    border: "none",
    color: "#0a1628",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "background-color var(--transition)",
  },
  sendBtnDisabled: {
    backgroundColor: "var(--bg-input)",
    color: "var(--text-muted)",
    cursor: "default",
  },
};
