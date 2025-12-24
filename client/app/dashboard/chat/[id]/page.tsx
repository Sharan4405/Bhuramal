'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { api, auth } from '@/lib/api';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatInput } from '@/components/chat/ChatInput';
import { MessageBubble } from '@/components/chat/MessageBubble';

interface Message {
  _id: string;
  text: string;
  direction: 'IN' | 'OUT';
  timestamp: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<'OPEN' | 'RESOLVED'>('OPEN');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string;

  useEffect(() => {
    const token = auth.getToken();
    if (!token) {
      router.push('/');
      return;
    }
    loadConversation(token);
    loadMessages(token);

    // Initialize WebSocket connection
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    socketRef.current = io(apiUrl, {
      transports: ['websocket', 'polling']
    });

    // Join conversation room
    socketRef.current.emit('join-conversation', conversationId);

    // Listen for new messages in real-time
    socketRef.current.on('new-message', (newMessage: Message) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some(msg => msg._id === newMessage._id)) {
          return prev;
        }
        return [...prev, newMessage];
      });
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-conversation', conversationId);
        socketRef.current.disconnect();
      }
    };
  }, [conversationId, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversation = async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/conversations?status=`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const conv = data.conversations.find((c: any) => c._id === conversationId);
      if (conv) {
        setStatus(conv.status);
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  };

  const loadMessages = async (token: string) => {
    try {
      const data = await api.getMessages(token, conversationId);
      setMessages(data.messages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (message: string) => {
    const token = auth.getToken();
    if (!token) return;

    setSending(true);
    try {
      await api.sendMessage(token, conversationId, message);
      // No need to reload - WebSocket will notify us
    } catch (err) {
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    const token = auth.getToken();
    if (!token) return;
    
    try {
      await api.resolveConversation(token, conversationId);
      setStatus('RESOLVED');
    } catch (err) {
      alert('Failed to resolve conversation');
    }
  };

  const handleReopen = async () => {
    const token = auth.getToken();
    if (!token) return;
    
    try {
      await api.reopenConversation(token, conversationId);
      setStatus('OPEN');
    } catch (err) {
      alert('Failed to reopen conversation');
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <ChatHeader 
        onBack={() => router.push('/dashboard')} 
        onResolve={handleResolve}
        onReopen={handleReopen}
        status={status}
      />

      <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
        {loading ? (
          <div className="text-center py-8 text-gray-600">
            Loading messages...
          </div>
        ) : (
          <div className="max-w-4xl mx-auto flex flex-col gap-4">
            {messages.map((msg) => (
              <MessageBubble key={msg._id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <ChatInput onSend={handleSend} disabled={sending} />
    </div>
  );
}
