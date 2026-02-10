import { Outlet } from 'react-router-dom';
import { Sidebar, BottomNav } from './Sidebar';

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="md:ml-60 pb-20 md:pb-0 min-h-screen">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
