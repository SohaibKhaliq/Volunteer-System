import { Outlet } from 'react-router-dom';

// Neutral volunteer layout: no sidebar/topbar. Kept for compatibility if referenced.
export default function VolunteerLayout() {
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  );
}
