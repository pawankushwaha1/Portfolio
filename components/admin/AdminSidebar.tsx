'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FolderGit2, 
  Briefcase, 
  Wrench, 
  Settings, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Projects', href: '/admin/projects', icon: FolderGit2 },
    { label: 'Experience', href: '/admin/experience', icon: Briefcase },
    { label: 'Skills', href: '/admin/skills', icon: Wrench },
    { label: 'Settings & Bio', href: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header">
        <div className="admin-brand">
          <div className="admin-brand-icon">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="admin-brand-title">Pawan Studio</h2>
            <span className="admin-brand-badge">Local CMS</span>
          </div>
        </div>
      </div>

      <nav className="admin-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="admin-sidebar-footer">
        <Link href="/" target="_blank" className="admin-nav-item view-site-btn">
          <ExternalLink size={18} />
          <span>View Public Site</span>
        </Link>
        <div className="admin-system-status">
          <span className="status-indicator-dot online"></span>
          <span>Connected to Git</span>
        </div>
      </div>
    </aside>
  );
}
