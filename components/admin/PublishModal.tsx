'use client';

import React, { useState } from 'react';
import { Rocket, CheckCircle2, AlertCircle, Loader2, X, GitCommit, ArrowUpRight } from 'lucide-react';

interface Step {
  step: string;
  status: 'pending' | 'success' | 'failed';
  detail?: string;
}

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublished?: () => void;
}

export default function PublishModal({ isOpen, onClose, onPublished }: PublishModalProps) {
  const [message, setMessage] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePublish = async () => {
    setPublishing(true);
    setError(null);
    setSuccess(false);

    setSteps([
      { step: 'Validating content files', status: 'pending' },
      { step: 'Staging content & images in Git', status: 'pending' },
      { step: 'Creating Git commit', status: 'pending' },
      { step: 'Pushing to GitHub (origin/main)', status: 'pending' },
      { step: 'Triggering Vercel deployment', status: 'pending' },
    ]);

    try {
      const res = await fetch('/api/admin/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to publish changes.');
        if (data.steps) setSteps(data.steps);
      } else {
        setSuccess(true);
        if (data.steps) setSteps(data.steps);
        if (onPublished) onPublished();
      }
    } catch (err: any) {
      setError(err.message || 'Network error during publish.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal-box publish-modal">
        <div className="admin-modal-header">
          <div className="modal-title-wrap">
            <Rocket className="text-accent" size={22} />
            <div>
              <h3>Publish to Live Website</h3>
              <p>Validates content, creates a Git commit, and pushes to GitHub + Vercel.</p>
            </div>
          </div>
          {!publishing && (
            <button className="admin-modal-close" onClick={onClose}>
              <X size={20} />
            </button>
          )}
        </div>

        <div className="admin-modal-body">
          {!success && !publishing && (
            <div className="publish-form">
              <label htmlFor="commitMsg">Commit Note (Optional)</label>
              <input
                id="commitMsg"
                type="text"
                className="admin-input"
                placeholder="e.g. Added new Gantri product photos & updated bio"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div className="publish-notice">
                <GitCommit size={16} />
                <span>
                  All changes currently saved in <strong>Drafts</strong> will be bundled and pushed to <code>origin/main</code>.
                </span>
              </div>
            </div>
          )}

          {(publishing || steps.length > 0) && (
            <div className="publish-steps-list">
              {steps.map((st, i) => (
                <div key={i} className={`publish-step-item ${st.status}`}>
                  <div className="step-icon">
                    {st.status === 'success' && <CheckCircle2 size={18} className="text-green" />}
                    {st.status === 'failed' && <AlertCircle size={18} className="text-red" />}
                    {st.status === 'pending' && <Loader2 size={18} className="spinner" />}
                  </div>
                  <div className="step-content">
                    <span className="step-label">{st.step}</span>
                    {st.detail && <span className="step-detail">{st.detail}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="admin-alert alert-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="admin-alert alert-success">
              <CheckCircle2 size={20} />
              <div>
                <strong>Deployment Initiated!</strong>
                <p>GitHub received the new commit. Vercel is now building and deploying your live site.</p>
                <div className="alert-links">
                  <a
                    href="https://github.com/pawankushwaha1/Portfolio/actions"
                    target="_blank"
                    rel="noreferrer"
                    className="alert-link"
                  >
                    View GitHub Actions <ArrowUpRight size={14} />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="admin-modal-footer">
          {success ? (
            <button className="admin-btn btn-primary" onClick={onClose}>
              Done
            </button>
          ) : (
            <>
              <button
                className="admin-btn btn-secondary"
                onClick={onClose}
                disabled={publishing}
              >
                Cancel
              </button>
              <button
                className="admin-btn btn-primary publish-action-btn"
                onClick={handlePublish}
                disabled={publishing}
              >
                {publishing ? (
                  <>
                    <Loader2 size={16} className="spinner" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Rocket size={16} />
                    Confirm & Publish
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
