'use client';

import { Button } from '../ui/Button';

interface ChatHeaderProps {
  onBack: () => void;
  onResolve: () => void;
  onReopen: () => void;
  status: 'OPEN' | 'RESOLVED';
}

export function ChatHeader({ onBack, onResolve, onReopen, status }: ChatHeaderProps) {
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
        {status === 'RESOLVED' && (
          <span className="bg-gray-300 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
            RESOLVED
          </span>
        )}
      </div>
      <div className="flex gap-3">
        {status === 'OPEN' ? (
          <Button variant="success" onClick={onResolve}>
            Mark Resolved
          </Button>
        ) : (
          <Button variant="primary" onClick={onReopen}>
            Reopen Conversation
          </Button>
        )}
      </div>
    </div>
  );
}
