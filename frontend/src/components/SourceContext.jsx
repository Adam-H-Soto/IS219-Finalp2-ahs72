import { useState } from "react";

export default function SourceContext({ sources }) {
  const [open, setOpen] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div style={styles.wrapper}>
      <button style={styles.toggle} onClick={() => setOpen((o) => !o)}>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        {open ? "Hide sources" : `Show sources (${sources.length})`}
      </button>

      {open && (
        <div style={styles.list} className="fade-in">
          {sources.map((src, i) => (
            <div key={i} style={styles.chunk}>
              <div style={styles.chunkMeta}>Page {src.page_number}</div>
              <p style={styles.chunkText}>{src.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    marginTop: 8,
  },
  toggle: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    background: "none",
    border: "none",
    color: "var(--text-muted)",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    padding: 0,
    transition: "color var(--transition)",
  },
  list: {
    marginTop: 8,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  chunk: {
    backgroundColor: "var(--bg-primary)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "10px 12px",
  },
  chunkMeta: {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--accent)",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    marginBottom: 5,
  },
  chunkText: {
    fontSize: 12,
    color: "var(--text-secondary)",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
};
