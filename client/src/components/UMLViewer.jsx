import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#4f8ef7',
    primaryTextColor: '#e8edf5',
    primaryBorderColor: '#2d3748',
    lineColor: '#8b96af',
    secondaryColor: '#161d2e',
    tertiaryColor: '#1c2539',
    background: '#111622',
    mainBkg: '#161d2e',
    nodeBorder: '#4f8ef7',
    clusterBkg: '#1c2539',
    titleColor: '#e8edf5',
    edgeLabelBackground: '#161d2e',
  },
  fontFamily: 'Inter, sans-serif',
  fontSize: 13,
});

let idCounter = 0;

export default function UMLViewer({ diagrams = [] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [svgMap, setSvgMap] = useState({});
  const [errors, setErrors] = useState({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!diagrams[activeIdx]) return;
    const key = diagrams[activeIdx].diagram_type;
    if (svgMap[key]) return; // already rendered

    const src = diagrams[activeIdx].mermaid_source;
    const id = `mermaid-${++idCounter}`;

    mermaid.render(id, src)
      .then(({ svg }) => setSvgMap((prev) => ({ ...prev, [key]: svg })))
      .catch((err) => setErrors((prev) => ({ ...prev, [key]: String(err) })));
  }, [activeIdx, diagrams]);

  const copySource = () => {
    const src = diagrams[activeIdx]?.mermaid_source;
    if (src) {
      navigator.clipboard.writeText(src);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const downloadSvg = () => {
    const key = diagrams[activeIdx]?.diagram_type;
    const svg = svgMap[key];
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${key}_diagram.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!diagrams.length) {
    return (
      <div className="uml-viewer" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        🎨 UML diagrams will appear here once analysis is complete
      </div>
    );
  }

  const active = diagrams[activeIdx];
  const key = active?.diagram_type;

  return (
    <div className="uml-viewer">
      <div className="uml-tabs">
        {diagrams.map((d, i) => (
          <button
            key={d.diagram_type}
            className={`uml-tab ${i === activeIdx ? 'active' : ''}`}
            onClick={() => setActiveIdx(i)}
          >
            {d.diagram_type.charAt(0).toUpperCase() + d.diagram_type.slice(1)}
          </button>
        ))}
      </div>

      <div className="uml-canvas">
        {svgMap[key] ? (
          <div dangerouslySetInnerHTML={{ __html: svgMap[key] }} style={{ width: '100%' }} />
        ) : errors[key] ? (
          <div style={{ width: '100%' }}>
            <div style={{ color: 'var(--accent-red)', marginBottom: '12px', fontSize: '0.85rem' }}>
              ⚠️ Diagram syntax error — showing raw source
            </div>
            <pre style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '8px', fontSize: '0.78rem', overflowX: 'auto', color: 'var(--text-secondary)' }}>
              {active?.mermaid_source}
            </pre>
          </div>
        ) : (
          <div className="streaming-bar">
            <div className="streaming-dot" />
            Rendering diagram...
          </div>
        )}
      </div>

      <div className="uml-actions">
        <button className="btn-secondary" onClick={copySource}>
          {copied ? '✅ Copied!' : '📋 Copy Source'}
        </button>
        {svgMap[key] && (
          <button className="btn-secondary" onClick={downloadSvg}>
            ⬇️ Download SVG
          </button>
        )}
      </div>
    </div>
  );
}
