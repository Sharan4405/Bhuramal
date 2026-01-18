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
  showStatus?: boolean; // Whether to show status badge
}

export function ConversationCard({ conversation, onClick, showStatus = false }: ConversationCardProps) {
  return (
    <Card hover onClick={onClick}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{conversation.user}</h3>
            {showStatus && <Badge status={conversation.status} />}
          </div>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {conversation.lastMessage || 'No messages yet'}
          </p>
          <p className="text-gray-500 text-xs font-medium">
            {new Date(conversation.lastMessageAt).toLocaleString()}
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-md shrink-0 ml-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
      </div>
    </Card>
  );
}
