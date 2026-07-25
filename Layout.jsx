import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const STATUS_COLORS = {
  DRAFT: 'bg-slate-200 text-slate-700',
  SUBMISSION_OPEN: 'bg-emerald-100 text-emerald-800',
  CLOSED: 'bg-amber-100 text-amber-800',
  AWARD_PUBLISHED: 'bg-navy-800 text-white',
  COOLING_OFF: 'bg-amber-100 text-amber-900',
  CANCELLED: 'bg-red-100 text-red-800',
};

export function StatusBadge({ status }) {
  const cls = STATUS_COLORS[status] || 'bg-slate-100 text-slate-700';
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {status?.replaceAll('_', ' ')}
    </span>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-navy-900 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="font-display text-xl font-semibold tracking-tight">EBMS</span>
            <span className="hidden text-xs text-navy-700 sm:inline text-slate-300">
              Electronic Bid Management System
            </span>
          </Link>
          {user && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-300">
                {user.name} <span className="text-slate-500">·</span> {user.role.replaceAll('_', ' ')}
              </span>
              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="rounded-md border border-slate-600 px-3 py-1.5 text-slate-200 transition hover:border-gold-500 hover:text-gold-500"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
