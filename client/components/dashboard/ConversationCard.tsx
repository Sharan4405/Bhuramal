'use client';

import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface Conversation {
  _id: string;
  user: string;
  status: 'OPEN' | 'RESOLVED';
  lastMessage: string;
  lastMessageAt: string;
}

interface ConversationCardProps {
  conversation: Conversation;
  onClick: () => void;
}

export function ConversationCard({ conversation, onClick }: ConversationCardProps) {
  return (
    <Card hover onClick={onClick}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold">{conversation.user}</h3>
            <Badge status={conversation.status} />
          </div>
          <p className="text-gray-600 text-sm mb-2">
            {conversation.lastMessage || 'No messages yet'}
          </p>
          <p className="text-gray-500 text-xs">
            {new Date(conversation.lastMessageAt).toLocaleString()}
          </p>
        </div>
        <div className="bg-[rgb(var(--green))] text-white w-10 h-10 rounded-full flex items-center justify-center text-xl">
          💬
        </div>
      </div>
    </Card>
  );
}
