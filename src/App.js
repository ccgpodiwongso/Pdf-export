import { useState } from "react";

const TABLES = [
  {
    name: "Product Specs",
    rows: [
      ["Field", "Value"],
      ["Code", "DL3847"],
      ["Product", "Galaxy Snoot 40"],
      ["Description", "7.2Watt Trimless 2 Level Fixed Downlight"],
      ["System Power", "9W"],
      ["LED Power", "200mA 36V"],
      ["Lumens (at 3000K)", "495lm"],
      ["CRI", "93/97"],
      ["Lifetime (Ta 25°C)", "50,000h L90B20"],
    ],
  },
  {
    name: "Certifications & Features",
    rows: [
      ["Property", "Value"],
      ["IP Rating", "IP21"],
      ["Class", "Class III"],
      ["Mounting Type", "Ceiling Recessed"],
      ["Anti Glare", "UGR<19"],
      ["Blue Light", "RG1"],
      ["Cutout Depth", "50mm"],
      ["Recyclability", "Highly recyclable"],
      ["Packaging", "FSC Package"],
    ],
  },
  {
    name: "Key Information",
    rows: [
      ["Property", "Value"],
      ["Material", "Aluminium"],
      ["Mounting", "Ceiling Recessed"],
      ["Gear", "This product is supplied without gear."],
      ["Warranty", "5 Year"],
    ],
  },
  {
    name: "Dimensions",
    rows: [
      ["Dimension", "Value"],
      ["Max Tilt", "20°"],
      ["Height", "80mm"],
      ["Cutout Diameter", "Ø40mm"],
      ["Overall Diameter", "Ø100mm"],
    ],
  },
  {
    name: "Finish / CCT / Beam Options",
    rows: [
      ["Option Type", "Values"],
      ["Finish", "Powder Coat, Liquid Paint, Anodize"],
      ["LED CCT", "2700K, 3000K, 4000K"],
      ["Beam Angle", "15°, 24°, 36°"],
    ],
  },
  {
    name: "Light Distribution — 3000K Spot 15°",
    rows: [
      ["h (m)", "E (lx)", "ø (m)"],
      ["1", "1972", "ø0.27"],
      ["2", "492.9", "ø0.54"],
      ["3", "219.1", "ø0.82"],
      ["4", "123.2", "ø1.09"],
      ["5", "78.87", "ø1.36"],
    ],
  },
];

function toTSV(rows) {
  return rows.map(r => r.join("\t")).join("\n");
}

export default function App() {
  const [copied, setCopied] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const copyTable = (rows, idx) => {
    navigator.clipboard.writeText(toTSV(rows)).then(() => {
      setCopied(idx);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const copyAll = () => {
    const all = TABLES.map(t => t.name + "\n" + toTSV(t.rows)).join("\n\n");
    navigator.clipboard.writeText(all).then(() => {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    });
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0f0f14",
      fontFamily: "'DM Mono', monospace", padding: "28px 16px", color: "#fff",
    }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "linear-gradient(135deg, #e65a32, #ff8c5a)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
              }}>💡</div>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.03em" }}>DL3847 — Galaxy Snoot 40</div>
            </div>
            <div style={{ color: "#555", fontSize: 11, paddingLeft: 42 }}>7.2W Trimless 2 Level Fixed Downlight · vjclighting.com</div>
          </div>
          <button
            onClick={copyAll}
            style={{
              background: copiedAll ? "#0d2b1a" : "linear-gradient(135deg, #e65a32, #ff7a50)",
              color: copiedAll ? "#5de88a" : "#fff",
              border: copiedAll ? "1px solid #1a5c30" : "none",
              borderRadius: 8, padding: "9px 18px", fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
          >
            {copiedAll ? "✓ All Copied!" : "Copy All Tables"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 16 }}>
          {TABLES.map((table, idx) => {
            const [header, ...dataRows] = table.rows;
            return (
              <div key={idx} style={{
                background: "#1a1a22", border: "1px solid #2a2a35", borderRadius: 12, overflow: "hidden",
              }}>
                <div style={{
                  padding: "10px 14px", borderBottom: "1px solid #2a2a35",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span style={{ color: "#e65a32", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
                    {table.name}
                  </span>
                  <button
                    onClick={() => copyTable(table.rows, idx)}
                    style={{
                      background: copied === idx ? "#0d2b1a" : "#222230",
                      color: copied === idx ? "#5de88a" : "#888",
                      border: `1px solid ${copied === idx ? "#1a5c30" : "#2a2a35"}`,
                      borderRadius: 5, padding: "3px 11px", fontSize: 10,
                      cursor: "pointer", fontFamily: "inherit", fontWeight: 600,
                      transition: "all 0.15s",
                    }}
                  >
                    {copied === idx ? "✓ Copied!" : "Copy"}
                  </button>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr>
                      {header.map((h, i) => (
                        <th key={i} style={{
                          background: "#111118", color: "#888",
                          padding: "7px 12px", textAlign: "left", fontWeight: 600,
                          borderBottom: "1px solid #1e1e28",
                          borderRight: i < header.length - 1 ? "1px solid #1e1e28" : "none",
                          fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataRows.map((row, ri) => (
                      <tr key={ri}>
                        {row.map((cell, ci) => (
                          <td key={ci} style={{
                            padding: "7px 12px",
                            color: ci === 0 ? "#aaa" : "#ddd",
                            fontWeight: ci === 0 ? 600 : 400,
                            background: ri % 2 === 0 ? "#17171f" : "#141419",
                            borderBottom: ri < dataRows.length - 1 ? "1px solid #1e1e28" : "none",
                            borderRight: ci < row.length - 1 ? "1px solid #1e1e28" : "none",
                            whiteSpace: ci === row.length - 1 ? "normal" : "nowrap",
                          }}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 18, color: "#2a2a35", fontSize: 10, textAlign: "center" }}>
          Click "Copy" on any table → Ctrl+V in Excel → columns split automatically
        </div>
      </div>
    </div>
  );
}
