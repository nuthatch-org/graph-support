import { ImageResponse } from "next/og";

export const alt = "Ask Graphy: an astronaut hedgehog who answers questions about The Graph";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The page's Graphy uses CSS variables, which the image renderer cannot resolve, so this copy is literal.
function graphySvg() {
  const spikes = Array.from({ length: 11 }, (_, i) => {
    const a = Math.PI * (0.95 + (i / 10) * 1.1);
    const p = (r: number, d: number) => `${(60 + Math.cos(a + d) * r).toFixed(1)},${(66 + Math.sin(a + d) * r).toFixed(1)}`;
    return `<path d="M${p(30, -0.12)} L${p(44, 0)} L${p(30, 0.12)}Z" fill="#8a5a3c"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
<ellipse cx="60" cy="108" rx="30" ry="5" fill="rgba(0,0,0,.35)"/>
<rect x="36" y="80" width="48" height="26" rx="12" fill="#e8e9f3" stroke="#c9cbe8" stroke-width="2"/>
<rect x="52" y="86" width="16" height="10" rx="3" fill="#f2a65a"/>
<circle cx="56" cy="91" r="1.6" fill="#e8e9f3"/><circle cx="64" cy="91" r="1.6" fill="#e8e9f3"/>
${spikes}
<ellipse cx="60" cy="68" rx="28" ry="24" fill="#8a5a3c"/>
<ellipse cx="66" cy="72" rx="20" ry="17" fill="#e9c9a3"/>
<circle cx="60" cy="68" r="3.2" fill="#2a1d14"/><circle cx="74" cy="68" r="3.2" fill="#2a1d14"/>
<circle cx="61" cy="67" r="1" fill="#fff"/><circle cx="75" cy="67" r="1" fill="#fff"/>
<ellipse cx="84" cy="76" rx="4" ry="3" fill="#2a1d14"/>
<path d="M66,80 Q71,84 76,80" stroke="#2a1d14" stroke-width="2" fill="none" stroke-linecap="round"/>
<ellipse cx="55" cy="77" rx="3.5" ry="2" fill="#f19a8f"/>
<circle cx="62" cy="66" r="42" fill="rgba(170,200,255,.14)" stroke="#c9cbe8" stroke-width="2.5"/>
<path d="M34,46 Q44,32 60,30" stroke="rgba(255,255,255,.55)" stroke-width="4" fill="none" stroke-linecap="round"/>
<line x1="62" y1="24" x2="62" y2="12" stroke="#c9cbe8" stroke-width="2"/>
<circle cx="62" cy="10" r="4" fill="#f2a65a"/>
</svg>`;
}

const STARS = [
  [80, 70], [210, 520], [340, 120], [560, 40], [620, 580], [760, 150], [900, 540], [1010, 60], [1130, 300], [1160, 590],
  [450, 330], [130, 300], [700, 420], [980, 230], [270, 600], [1080, 470], [40, 480], [520, 250],
];

export default function OpenGraphImage() {
  const src = `data:image/svg+xml;base64,${Buffer.from(graphySvg()).toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", alignItems: "center", padding: "0 80px",
          background: "linear-gradient(135deg, #0f1020 0%, #1b1d3a 60%, #2a1f3d 100%)", color: "#ecebf5",
          fontFamily: "sans-serif", position: "relative",
        }}
      >
        {STARS.map(([x, y], i) => (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: i % 3 ? 3 : 5, height: i % 3 ? 3 : 5, borderRadius: 9999, background: "#a3a2bd", opacity: i % 2 ? 0.5 : 0.9 }} />
        ))}
        <img src={src} width={400} height={400} style={{ marginRight: 56 }} />
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 620 }}>
          <div style={{ fontSize: 92, fontWeight: 800, letterSpacing: -3, lineHeight: 1 }}>Ask Graphy</div>
          <div style={{ fontSize: 34, color: "#c9c8dd", marginTop: 22, lineHeight: 1.3 }}>
            An astronaut hedgehog who has read every Graph support thread so you don&apos;t have to.
          </div>
          <div
            style={{
              display: "flex", marginTop: 36, padding: "16px 22px", borderRadius: 14, background: "rgba(255,255,255,.07)",
              border: "1px solid rgba(255,255,255,.14)", fontSize: 26, color: "#f2a65a", fontFamily: "monospace",
            }}
          >
            IE084 · bad indexers · TAP · rewards
          </div>
        </div>
      </div>
    ),
    size,
  );
}
