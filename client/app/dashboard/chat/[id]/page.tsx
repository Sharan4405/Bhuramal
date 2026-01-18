'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { api, auth } from '@/lib/api';
import { AdminNav } from '@/components/dashboard/AdminNav';
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
  }, [conversationId, router]); // Added filter dependency

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
    <>
      <AdminNav />
      <div className="h-screen flex flex-col">
        {/* Chat Header with Back Button and Actions */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-16 z-30 shadow-sm">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Back to conversations"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h2 className="font-semibold text-gray-900">Conversation</h2>
                <p className="text-sm text-gray-500">ID: {conversationId.slice(-8)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                status === 'OPEN' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {status}
              </span>
              {status === 'OPEN' ? (
                <button
                  onClick={handleResolve}
                  className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Resolve
                </button>
              ) : (
                <button
                  onClick={handleReopen}
                  className="px-4 py-2 text-sm bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg font-medium transition-colors"
                >
                  Reopen
                </button>
              )}
            </div>
          </div>
        </div>

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
    </>
  );
}
