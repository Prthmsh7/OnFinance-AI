import { useState } from 'react';
import { submitFeedback } from '../api/client';
import { useApp } from '../context/AppContext';

export default function FeedbackWidget({ sessionId }) {
  const { showToast } = useApp();
  const [rating, setRating] = useState(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!rating) { showToast('Please rate the analysis first', 'error'); return; }
    setLoading(true);
    try {
      await submitFeedback({ session_id: sessionId, rating, comment: comment || null });
      setSubmitted(true);
      showToast('Feedback recorded — thank you! 🎉');
    } catch {
      showToast('Failed to submit feedback', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="feedback-bar">
        <span style={{ color: 'var(--accent-green)', fontSize: '0.9rem', fontWeight: 600 }}>
          ✅ Thank you! Your feedback helps improve future analysis.
        </span>
      </div>
    );
  }

  return (
    <div className="feedback-bar">
      <span className="feedback-bar-label">Was this analysis helpful?</span>
      <button
        className={`feedback-thumb ${rating === 2 ? 'selected' : ''}`}
        onClick={() => setRating(2)}
        title="Thumbs up"
      >👍</button>
      <button
        className={`feedback-thumb ${rating === 1 ? 'selected' : ''}`}
        onClick={() => setRating(1)}
        title="Thumbs down"
      >👎</button>
      <div className="feedback-comment">
        <input
          className="form-input"
          style={{ padding: '8px 14px', fontSize: '0.82rem' }}
          placeholder="Optional comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
      <button className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.82rem' }} onClick={handleSubmit} disabled={loading}>
        {loading ? '...' : 'Submit'}
      </button>
    </div>
  );
}
