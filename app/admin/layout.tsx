'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import PublishModal from '@/components/admin/PublishModal';
import { Rocket, RefreshCw, GitBranch } from 'lucide-react';
import '@/app/admin.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [gitStatus, setGitStatus] = useState<{
    clean: boolean;
    uncommittedFiles: string[];
    branch: string;
    lastCommit: string;
  } | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/admin/publish');
      const data = await res.json();
      if (data.success && data.status) {
        setGitStatus(data.status);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="admin-root">
      <AdminSidebar />

      <div className="admin-main-wrapper">
        <header className="admin-topbar">
          <div className="topbar-left">
            <h1 className="topbar-title">Portfolio CMS & Deployment Hub</h1>
            <div className="topbar-meta">
              <span className="meta-badge branch-badge">
                <GitBranch size={13} />
                <span>{gitStatus?.branch || 'main'}</span>
              </span>
              {gitStatus && (
                <span
                  className={`meta-badge status-badge ${
                    gitStatus.clean ? 'clean' : 'dirty'
                  }`}
                >
                  {gitStatus.clean ? (
                    'Everything Up to Date'
                  ) : (
                    <>
                      <strong>{gitStatus.uncommittedFiles.length}</strong> uncommitted changes
                    </>
                  )}
                </span>
              )}
            </div>
          </div>

          <div className="topbar-actions">
            <button
              className="admin-btn-icon"
              onClick={fetchStatus}
              title="Refresh Git status"
            >
              <RefreshCw size={16} className={loadingStatus ? 'spinner' : ''} />
            </button>

            <button
              className="admin-btn btn-publish-live"
              onClick={() => setPublishModalOpen(true)}
            >
              <Rocket size={16} />
              <span>Publish to Live</span>
            </button>
          </div>
        </header>

        <main className="admin-content-area">{children}</main>

        <PublishModal
          isOpen={publishModalOpen}
          onClose={() => setPublishModalOpen(false)}
          onPublished={fetchStatus}
        />
      </div>
    </div>
  );
}
