'use client';

interface Message {
  _id: string;
  text: string;
  direction: 'IN' | 'OUT';
  timestamp: string;
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div className={message.direction === 'IN' ? 'message-in' : 'message-out'}>
      <p className="mb-1">{message.text}</p>
      <p 
        className={`text-xs opacity-70 ${
          message.direction === 'OUT' ? 'text-right' : 'text-left'
        }`}
      >
        {new Date(message.timestamp).toLocaleTimeString()}
      </p>
    </div>
  );
}
