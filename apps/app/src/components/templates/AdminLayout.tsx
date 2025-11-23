import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export default function AdminLayout() {
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
