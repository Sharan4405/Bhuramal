'use client';

import { Button } from '../ui/Button';

interface ChatHeaderProps {
  onBack: () => void;
  onResolve: () => void;
}

export function ChatHeader({ onBack, onResolve }: ChatHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="bg-transparent border-none text-2xl cursor-pointer hover:opacity-70"
        >
          ←
        </button>
        <h1 className="text-xl font-semibold">Customer Support</h1>
      </div>
      <Button variant="success" onClick={onResolve}>
        Mark Resolved
      </Button>
    </div>
  );
}
