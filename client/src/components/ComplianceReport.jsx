import { useState } from 'react';

const SEVERITY_COLORS = {
  high: 'tag-red', critical: 'tag-red',
  medium: 'tag-amber', moderate: 'tag-amber',
  low: 'tag-green', minor: 'tag-green',
};

const AREA_COLORS = ['tag-blue', 'tag-purple', 'tag-green', 'tag-amber', 'tag-red'];

function Section({ title, icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="accordion-item">
      <div className="accordion-header" onClick={() => setOpen(!open)}>
        <div className="accordion-title">
          <span>{icon}</span> {title}
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && <div className="accordion-body">{children}</div>}
    </div>
  );
}

export default function ComplianceReport({ report }) {
  if (!report) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        📊 Compliance analysis will appear here...
      </div>
    );
  }

  const { new_requirements = [], gap_analysis = [], it_impact = [] } = report;

  return (
    <div>
      {/* Executive summary */}
      {report.executive_summary && (
        <div className="card" style={{ padding: '16px 20px', marginBottom: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '8px' }}>Executive Summary</div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{report.executive_summary}</p>
        </div>
      )}

      <Section title="New Compliance Requirements" icon="🔴" >
        {new_requirements.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No new requirements identified</p>
        ) : new_requirements.map((req, i) => (
          <div key={i} className="requirement-card">
            <div className="requirement-title">
              <span className={`tag ${SEVERITY_COLORS[req.severity?.toLowerCase()] || 'tag-blue'}`}>
                {req.severity}
              </span>
              {req.title}
              {req.deadline && (
                <span className="tag tag-amber" style={{ marginLeft: 'auto' }}>🕐 {req.deadline}</span>
              )}
            </div>
            <p className="requirement-desc">{req.description}</p>
          </div>
        ))}
      </Section>

      <Section title="Gap Analysis" icon="🟡" defaultOpen={false}>
        {gap_analysis.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No gaps identified</p>
        ) : gap_analysis.map((gap, i) => (
          <div key={i} className="gap-row">
            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong style={{ fontSize: '0.9rem' }}>{gap.requirement}</strong>
              <span className={`tag ${SEVERITY_COLORS[gap.gap_severity?.toLowerCase()] || 'tag-blue'}`}>
                {gap.gap_severity}
              </span>
            </div>
            <div className="gap-col-current">
              <div className="gap-col-label">Current State</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{gap.current_state}</div>
            </div>
            <div className="gap-col-required">
              <div className="gap-col-label">Required State</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{gap.required_state}</div>
            </div>
            <div className="gap-rec">💡 <strong>Recommendation:</strong> {gap.recommendation}</div>
          </div>
        ))}
      </Section>

      <Section title="IT & Operational Impact" icon="🔵" defaultOpen={false}>
        {it_impact.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No impact areas identified</p>
        ) : it_impact.map((item, i) => (
          <div key={i} className="requirement-card">
            <div className="requirement-title">
              <span className={`tag ${AREA_COLORS[i % AREA_COLORS.length]}`}>{item.area}</span>
              <span className={`tag ${SEVERITY_COLORS[item.effort?.toLowerCase()] || 'tag-blue'}`}>
                {item.effort} effort
              </span>
            </div>
            <p className="requirement-desc" style={{ marginBottom: '8px' }}>{item.description}</p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {(item.tags || []).map((t, j) => (
                <span key={j} className={`tag ${AREA_COLORS[j % AREA_COLORS.length]}`}>{t}</span>
              ))}
            </div>
          </div>
        ))}
      </Section>
    </div>
  );
}
