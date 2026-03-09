import { useState, useRef, useCallback } from "react";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function toTSV(rows) {
  return rows.map(r => r.map(cell => {
    const s = String(cell ?? "");
    return s.includes("\t") || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  }).join("\t")).join("\n");
}

export default function App() {
  const [step, setStep] = useState("idle");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [tables, setTables] = useState([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const fileRef = useRef();

  const processFile = useCallback(async (file) => {
    if (!file || file.type !== "application/pdf") {
      setError("Please upload a valid PDF file.");
      setStep("error");
      return;
    }
    setFileName(file.name);
    setStep("loading");
    setTables([]);
    setError("");

    try {
      const base64 = await fileToBase64(file);
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 4000,
          messages: [{
            role: "user",
            content: [
              { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
              {
                type: "text",
                text: `Extract ALL tables and structured data from this PDF.

For each table, output it in this exact format — nothing else:

TABLE: <descriptive name>
col1\tcol2\tcol3
val1\tval2\tval3

Use real tab characters between columns. One row per line. No extra text, no markdown, no explanations.`
              }
            ]
          }]
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.content.find(b => b.type === "text")?.text || "";

      const chunks = text.split(/(?=TABLE:)/i).filter(c => c.trim().toUpperCase().startsWith("TABLE:"));
      const parsed = chunks.map((chunk) => {
        const lines = chunk.trim().split("\n").filter(Boolean);
        const name = lines[0].replace(/^TABLE:\s*/i, "").trim();
        const tsv = lines.slice(1).join("\n");
        return { name: name || "Extracted Table", tsv };
      }).filter(t => t.tsv.trim().length > 0);

      if (parsed.length === 0) {
        throw new Error("No tables found in this PDF.\n\nAI returned:\n" + text.slice(0, 400));
      }

      setTables(parsed);
      setStep("done");
    } catch (e) {
      setError(e.message);
      setStep("error");
    }
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    processFile(e.dataTransfer.files[0]);
  }, [processFile]);

  const copyTable = (rows, idx) => {
    const text = toTSV(rows);
    navigator.clipboard.writeText(text).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select(); document.execCommand("copy");
      document.body.removeChild(ta);
    }).finally(() => {
      setCopied(idx); setTimeout(() => setCopied(null), 2000);
    });
    navigator.clipboard.writeText(text).then(() => {
      setCopied(idx); setTimeout(() => setCopied(null), 2000);
    }).catch(() => {});
  };

  const copyAll = () => {
    const all = tables.map(t => toTSV(t.rows)).join("\n\n");
    navigator.clipboard.writeText(all).then(() => {
      setCopiedAll(true); setTimeout(() => setCopiedAll(false), 2000);
    });
  };

  const reset = () => {
    setStep("idle"); setTables([]); setFileName(""); setError("");
    setCopied(null); setCopiedAll(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f14", fontFamily: "'DM Mono', monospace", padding: "28px 16px", color: "#fff" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #e65a32, #ff8c5a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📋</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.03em" }}>PDF → Excel</div>
              <div style={{ color: "#555", fontSize: 11 }}>Upload PDF · Extract tables · Copy-paste into Excel</div>
            </div>
          </div>

          {/* Go back button — always visible when not on idle */}
          {step !== "idle" && (
            <button onClick={reset} style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#1a1a22", color: "#aaa",
              border: "1px solid #2a2a35", borderRadius: 8, padding: "8px 16px",
              fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 600,
              transition: "all 0.15s",
            }}>
              ← New PDF
            </button>
          )}

          {/* Copy all — only on done */}
          {step === "done" && (
            <button onClick={copyAll} style={{
              background: copiedAll ? "#0d2b1a" : "linear-gradient(135deg, #e65a32, #ff7a50)",
              color: copiedAll ? "#5de88a" : "#fff",
              border: copiedAll ? "1px solid #1a5c30" : "none",
              borderRadius: 8, padding: "9px 18px", fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
            }}>
              {copiedAll ? "✓ All Copied!" : "Copy All Tables"}
            </button>
          )}
        </div>

        {/* IDLE — drop zone */}
        {step === "idle" && (
          <div
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileRef.current.click()}
            style={{
              border: `2px dashed ${dragOver ? "#e65a32" : "#2a2a35"}`,
              borderRadius: 12, padding: "72px 32px", textAlign: "center", cursor: "pointer",
              background: dragOver ? "rgba(230,90,50,0.04)" : "#1a1a22", transition: "all 0.15s",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 14 }}>📄</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Drop your PDF here</div>
            <div style={{ color: "#555", fontSize: 12, marginBottom: 22 }}>or click to browse files</div>
            <div style={{ display: "inline-block", background: "linear-gradient(135deg, #e65a32, #ff7a50)", color: "#fff", borderRadius: 8, padding: "10px 24px", fontSize: 12, fontWeight: 700 }}>
              Choose PDF
            </div>
            <input ref={fileRef} type="file" accept=".pdf" onChange={e => processFile(e.target.files[0])} style={{ display: "none" }} />
          </div>
        )}

        {/* LOADING */}
        {step === "loading" && (
          <div style={{ background: "#1a1a22", border: "1px solid #2a2a35", borderRadius: 12, padding: "72px 32px", textAlign: "center" }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ width: 44, height: 44, border: "3px solid #2a2a35", borderTopColor: "#e65a32", borderRadius: "50%", margin: "0 auto 20px", animation: "spin 0.85s linear infinite" }} />
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Extracting tables...</div>
            <div style={{ color: "#555", fontSize: 11 }}>{fileName}</div>
          </div>
        )}

        {/* ERROR */}
        {step === "error" && (
          <div style={{ background: "#1a1a22", border: "1px solid #3a1a1a", borderRadius: 12, padding: "32px" }}>
            <div style={{ color: "#e85d5d", fontSize: 12, marginBottom: 20, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>⚠️ {error}</div>
          </div>
        )}

        {/* DONE — tables */}
        {step === "done" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ color: "#5de88a", fontSize: 11 }}>✓ Found {tables.length} table{tables.length !== 1 ? "s" : ""} in {fileName}</div>
            {tables.map((table, idx) => {
              const rows = table.tsv.split("\n").filter(Boolean).map(r => r.split("\t"));
              const headers = rows[0] || [];
              const dataRows = rows.slice(1);
              return (
                <div key={idx} style={{ background: "#1a1a22", border: "1px solid #2a2a35", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ padding: "10px 14px", borderBottom: "1px solid #2a2a35", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ color: "#e65a32", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>{table.name}</span>
                    <span style={{ color: "#444", fontSize: 10, marginLeft: 8 }}>{dataRows.length} rows · {headers.length} cols</span>
                    <button onClick={() => copyTable(rows, idx)} style={{
                      marginLeft: "auto", background: copied === idx ? "#0d2b1a" : "#222230",
                      color: copied === idx ? "#5de88a" : "#888",
                      border: `1px solid ${copied === idx ? "#1a5c30" : "#2a2a35"}`,
                      borderRadius: 5, padding: "3px 12px", fontSize: 10,
                      cursor: "pointer", fontFamily: "inherit", fontWeight: 600,
                    }}>
                      {copied === idx ? "✓ Copied!" : "Copy"}
                    </button>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                      <thead>
                        <tr>
                          {headers.map((h, i) => (
                            <th key={i} style={{ background: "#111118", color: "#888", padding: "7px 12px", textAlign: "left", fontWeight: 600, borderBottom: "1px solid #1e1e28", borderRight: i < headers.length - 1 ? "1px solid #1e1e28" : "none", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h || `Col ${i + 1}`}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {dataRows.map((row, ri) => (
                          <tr key={ri}>
                            {headers.map((_, ci) => (
                              <td key={ci} style={{ padding: "7px 12px", color: ci === 0 ? "#aaa" : "#ddd", fontWeight: ci === 0 ? 600 : 400, background: ri % 2 === 0 ? "#17171f" : "#141419", borderBottom: ri < dataRows.length - 1 ? "1px solid #1e1e28" : "none", borderRight: ci < headers.length - 1 ? "1px solid #1e1e28" : "none", whiteSpace: "nowrap", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis" }}>{row[ci] ?? ""}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ padding: "7px 14px", borderTop: "1px solid #1e1e28", color: "#333", fontSize: 10 }}>
                    Copy → Ctrl+V in Excel → columns split automatically
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
