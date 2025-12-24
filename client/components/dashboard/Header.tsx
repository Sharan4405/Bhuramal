'use client';

import { Button } from '../ui/Button';
import Image from 'next/image';

interface HeaderProps {
  onLogout: () => void;
}

export function DashboardHeader({ onLogout }: HeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Image src="/Bhuramal_Bhagirath_Logo-removebg-preview.png" alt="Bhuramal Logo" width={64} height={64} />
        <h1 className="text-2xl font-bold text-[rgb(var(--orange))]">
           Dashboard
        </h1>
        <Button onClick={onLogout}>
          Logout
        </Button>
      </div>
    </div>
  );
}
