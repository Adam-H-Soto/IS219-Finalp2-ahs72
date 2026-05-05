import { useState } from "react";
import UploadZone from "./components/UploadZone";
import PolicySummary from "./components/PolicySummary";
import ChatInterface from "./components/ChatInterface";

export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function App() {
  const [docId, setDocId] = useState(null);
  const [summary, setSummary] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  function handleUploadSuccess({ doc_id, summary: newSummary }) {
    setDocId(doc_id);
    setSummary(newSummary);
    setMessages([]);
  }

  return (
    <div style={styles.root}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>
            <span style={styles.logoMark}>⬡</span>
            <span style={styles.logoText}>PolicyLens</span>
          </div>
          <p style={styles.tagline}>AI-powered health insurance policy analysis</p>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.leftPanel}>
          <UploadZone
            onSuccess={handleUploadSuccess}
            hasDocument={!!docId}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
          {summary && (
            <div className="fade-in">
              <PolicySummary summary={summary} />
            </div>
          )}
        </div>

        <div style={styles.rightPanel}>
          <ChatInterface
            docId={docId}
            messages={messages}
            setMessages={setMessages}
          />
        </div>
      </main>
    </div>
  );
}

const styles = {
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    overflow: "hidden",
  },
  header: {
    borderBottom: "1px solid var(--border)",
    backgroundColor: "var(--bg-secondary)",
    flexShrink: 0,
  },
  headerInner: {
    maxWidth: 1400,
    margin: "0 auto",
    padding: "14px 28px",
    display: "flex",
    alignItems: "center",
    gap: 20,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  logoMark: {
    fontSize: 22,
    color: "var(--accent)",
    lineHeight: 1,
  },
  logoText: {
    fontFamily: "var(--font-display)",
    fontSize: 22,
    color: "var(--text-primary)",
    letterSpacing: "-0.3px",
  },
  tagline: {
    fontSize: 13,
    color: "var(--text-muted)",
    borderLeft: "1px solid var(--border)",
    paddingLeft: 20,
  },
  main: {
    display: "grid",
    gridTemplateColumns: "420px 1fr",
    flex: 1,
    overflow: "hidden",
  },
  leftPanel: {
    borderRight: "1px solid var(--border)",
    overflowY: "auto",
    padding: "24px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  rightPanel: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
};
