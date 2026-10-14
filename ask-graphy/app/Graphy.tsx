// Graphy: a hedgehog in a bubble helmet. Drawn inline so the page has no image requests.
export function Graphy({ size = 120, bob = false }: { size?: number; bob?: boolean }) {
  const spikes = Array.from({ length: 11 }, (_, i) => {
    const a = (Math.PI * (0.95 + (i / 10) * 1.1));
    const r1 = 30, r2 = 44;
    const x1 = 60 + Math.cos(a - 0.12) * r1, y1 = 66 + Math.sin(a - 0.12) * r1;
    const x2 = 60 + Math.cos(a) * r2, y2 = 66 + Math.sin(a) * r2;
    const x3 = 60 + Math.cos(a + 0.12) * r1, y3 = 66 + Math.sin(a + 0.12) * r1;
    return `M${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)} L${x3.toFixed(1)},${y3.toFixed(1)}Z`;
  });
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Graphy the astronaut hedgehog" className={bob ? "bob" : undefined}>
      <ellipse cx="60" cy="108" rx="30" ry="5" fill="var(--shadow)" />
      {/* suit */}
      <rect x="36" y="80" width="48" height="26" rx="12" fill="var(--suit)" stroke="var(--line)" strokeWidth="2" />
      <rect x="52" y="86" width="16" height="10" rx="3" fill="var(--accent)" />
      <circle cx="56" cy="91" r="1.6" fill="var(--suit)" />
      <circle cx="64" cy="91" r="1.6" fill="var(--suit)" />
      {/* spikes */}
      {spikes.map((d, i) => <path key={i} d={d} fill="var(--spike)" />)}
      {/* face */}
      <ellipse cx="60" cy="68" rx="28" ry="24" fill="var(--spike)" />
      <ellipse cx="66" cy="72" rx="20" ry="17" fill="var(--face)" />
      <circle cx="60" cy="68" r="3.2" fill="var(--ink)" />
      <circle cx="74" cy="68" r="3.2" fill="var(--ink)" />
      <circle cx="61" cy="67" r="1" fill="#fff" />
      <circle cx="75" cy="67" r="1" fill="#fff" />
      <ellipse cx="84" cy="76" rx="4" ry="3" fill="var(--ink)" />
      <path d="M66,80 Q71,84 76,80" stroke="var(--ink)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="55" cy="77" rx="3.5" ry="2" fill="var(--blush)" />
      {/* helmet */}
      <circle cx="62" cy="66" r="42" fill="var(--glass)" stroke="var(--line)" strokeWidth="2.5" />
      <path d="M34,46 Q44,32 60,30" stroke="#fff" strokeOpacity="0.55" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* antenna */}
      <line x1="62" y1="24" x2="62" y2="12" stroke="var(--line)" strokeWidth="2" />
      <circle cx="62" cy="10" r="4" fill="var(--accent)" className="blink" />
    </svg>
  );
}
