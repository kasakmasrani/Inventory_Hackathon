import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-dark-900">
      <Sidebar />
      <div className="flex-1 ml-64">
        <TopNav title="CoreInventory" />
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
