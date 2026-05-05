import { useRef, useState } from "react";
import { API_BASE } from "../App";

export default function UploadZone({ onSuccess, hasDocument, isLoading, setIsLoading }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState(null);
  const inputRef = useRef(null);

  async function uploadFile(file) {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a PDF file.");
      return;
    }

    setError(null);
    setFileName(file.name);
    setIsLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Upload failed");
      }
      onSuccess({ doc_id: data.doc_id, summary: data.summary });
    } catch (err) {
      setError(err.message);
      setFileName(null);
    } finally {
      setIsLoading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    uploadFile(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleFileChange(e) {
    uploadFile(e.target.files[0]);
    e.target.value = "";
  }

  if (hasDocument && !isLoading) {
    return (
      <div style={styles.successBadge} className="fade-in">
        <span style={styles.successIcon}>✓</span>
        <div>
          <div style={styles.successTitle}>Policy loaded</div>
          <div style={styles.successFile}>{fileName}</div>
        </div>
        <button
          style={styles.reuploadBtn}
          onClick={() => inputRef.current?.click()}
        >
          Replace
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          ...styles.zone,
          ...(isDragging ? styles.zoneDragging : {}),
          ...(isLoading ? styles.zoneLoading : {}),
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isLoading && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        {isLoading ? (
          <div style={styles.loadingState}>
            <div style={styles.spinner} />
            <div style={styles.loadingText}>Analyzing policy…</div>
            <div style={styles.loadingSubtext}>Extracting key details with AI</div>
          </div>
        ) : (
          <div style={styles.idleState}>
            <div style={styles.uploadIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div style={styles.uploadTitle}>Drop your policy PDF here</div>
            <div style={styles.uploadSubtitle}>or click to browse files</div>
          </div>
        )}
      </div>

      {error && (
        <div style={styles.error} className="fade-in">
          <span style={styles.errorIcon}>!</span>
          {error}
        </div>
      )}
    </div>
  );
}

const styles = {
  zone: {
    border: "2px dashed var(--border)",
    borderRadius: "var(--radius)",
    padding: "36px 24px",
    textAlign: "center",
    cursor: "pointer",
    transition: "all var(--transition)",
    backgroundColor: "var(--bg-secondary)",
  },
  zoneDragging: {
    borderColor: "var(--accent)",
    backgroundColor: "var(--accent-dim)",
  },
  zoneLoading: {
    cursor: "default",
    borderColor: "var(--border-accent)",
  },
  idleState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  },
  uploadIcon: {
    color: "var(--accent)",
    marginBottom: 4,
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: "var(--text-primary)",
  },
  uploadSubtitle: {
    fontSize: 13,
    color: "var(--text-secondary)",
  },
  loadingState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  },
  spinner: {
    width: 28,
    height: 28,
    border: "2.5px solid var(--border)",
    borderTopColor: "var(--accent)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: {
    fontSize: 15,
    fontWeight: 600,
    color: "var(--text-primary)",
  },
  loadingSubtext: {
    fontSize: 13,
    color: "var(--text-secondary)",
    animation: "pulse 2s ease infinite",
  },
  error: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    padding: "10px 14px",
    borderRadius: "var(--radius-sm)",
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    border: "1px solid rgba(255, 107, 107, 0.25)",
    color: "var(--danger)",
    fontSize: 13,
  },
  errorIcon: {
    fontWeight: 700,
    width: 18,
    height: 18,
    borderRadius: "50%",
    border: "1.5px solid var(--danger)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  successBadge: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    borderRadius: "var(--radius)",
    backgroundColor: "var(--accent-dim)",
    border: "1px solid var(--border-accent)",
  },
  successIcon: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    backgroundColor: "var(--accent)",
    color: "#0a1628",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 14,
    flexShrink: 0,
  },
  successTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--accent)",
  },
  successFile: {
    fontSize: 12,
    color: "var(--text-secondary)",
    maxWidth: 200,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  reuploadBtn: {
    marginLeft: "auto",
    background: "none",
    border: "1px solid var(--border-accent)",
    borderRadius: "var(--radius-sm)",
    color: "var(--accent)",
    fontSize: 12,
    padding: "4px 10px",
    cursor: "pointer",
    fontFamily: "var(--font-body)",
  },
};
