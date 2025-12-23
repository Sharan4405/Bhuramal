'use client';

import { Button } from '../ui/Button';

interface HeaderProps {
  onLogout: () => void;
}

export function DashboardHeader({ onLogout }: HeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[rgb(var(--orange))]">
          🌰 Bhuramal Dashboard
        </h1>
        <Button onClick={onLogout}>
          Logout
        </Button>
      </div>
    </div>
  );
}
