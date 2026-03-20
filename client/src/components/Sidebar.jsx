import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const DIAGRAM_LABELS = {
  sequential: 'Sequential',
  component: 'Component',
  class: 'Class',
  activity: 'Activity',
  stateMachine: 'State Machine',
  useCase: 'Use Case',
};

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useApp();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>⚖️ ComplianceAI</h2>
        <span>SEBI Circular Monitor</span>
      </div>

      <button
        className="sidebar-new-btn"
        onClick={() => navigate('/analyze')}
      >
        <span>＋</span> New Analysis
      </button>

      <div className="sidebar-section-title">Recent Sessions</div>
      <div className="sidebar-sessions">
        {state.sessions.length === 0 && (
          <div style={{ padding: '12px 20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            No sessions yet. Start a new analysis!
          </div>
        )}
        {state.sessions.map((s) => (
          <div
            key={s.id}
            className={`session-item ${location.pathname === `/results/${s.id}` ? 'active' : ''}`}
            onClick={() => navigate(`/results/${s.id}`)}
          >
            <div className="session-item-title">
              {s.circular_source
                ? s.circular_source.split('/').pop().replace(/\.[^.]+$/, '')
                : 'Untitled'}
            </div>
            <div className="session-item-meta">
              <span className={`status-badge ${s.status}`}>{s.status}</span>
              <span>{new Date(s.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
