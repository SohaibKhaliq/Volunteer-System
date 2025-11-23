import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useApp } from '@/providers/app-provider';

export default function AdminLayout() {
  const { user, authenticated } = useApp();
  const navigate = useNavigate();

  const isAdmin = !!(user?.isAdmin || (user?.roles && user.roles.some((r: any) => r.name === 'admin')));

  // If user is not authed, redirect to root
  if (!authenticated) {
    navigate('/');
    return null;
  }

  // If authenticated but not admin, show forbidden
  if (authenticated && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded shadow p-6 text-center">
          <h2 className="text-lg font-semibold mb-2">Access denied</h2>
          <p className="text-sm text-slate-600 mb-4">You don't have permission to view the admin panel.</p>
          <Link to="/" className="text-sm text-primary underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="flex">
        <aside className="w-64 p-4 border-r border-slate-200 bg-white h-screen sticky top-0">
          <h2 className="font-bold text-lg mb-4">Admin</h2>
          <nav className="flex flex-col gap-2">
            <Link to="/admin/users" className="px-3 py-2 rounded hover:bg-slate-100">
              Users
            </Link>
            <Link to="/admin/organizations" className="px-3 py-2 rounded hover:bg-slate-100">
              Organizations
            </Link>
            <Link to="/admin/events" className="px-3 py-2 rounded hover:bg-slate-100">
              Events
            </Link>
            <Link to="/admin/tasks" className="px-3 py-2 rounded hover:bg-slate-100">
              Tasks
            </Link>
            <Link to="/admin/compliance" className="px-3 py-2 rounded hover:bg-slate-100">
              Compliance
            </Link>
            <Link to="/admin/reports" className="px-3 py-2 rounded hover:bg-slate-100">
              Reports
            </Link>
          </nav>
        </aside>

        <div className="flex-1 p-6">
          <header className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Admin panel</h1>
            <div className="flex items-center gap-3">👋 Admin</div>
          </header>

          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
