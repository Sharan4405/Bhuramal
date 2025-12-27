'use client';

import { Button } from '../ui/Button';
import Image from 'next/image';
import Link from 'next/link';

interface HeaderProps {
  onLogout: () => void;
}

export function DashboardHeader({ onLogout }: HeaderProps) {
  return (
    <div className="bg-white border-b-2 border-orange-100 px-8 py-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Image src="/Bhuramal_Bhagirath_Logo-removebg-preview.png" alt="Bhuramal Logo" width={64} height={64} />
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-lg font-semibold text-gray-700 hover:text-[rgb(var(--orange))] transition-colors">
            Conversations
          </Link>
          <Link href="/dashboard/products" className="text-lg font-semibold text-gray-700 hover:text-[rgb(var(--orange))] transition-colors">
            Products
          </Link>
          <Link href="/dashboard/orders" className="text-lg font-semibold text-gray-700 hover:text-[rgb(var(--orange))] transition-colors">
            Orders
          </Link>
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
           Admin Panel
        </h1>
        <Button onClick={onLogout} className="bg-[rgb(var(--orange))] hover:bg-orange-600 text-white">
          Logout
        </Button>
      </div>
    </div>
  );
}
