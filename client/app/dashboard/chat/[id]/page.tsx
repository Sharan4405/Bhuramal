'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string;

  useEffect(() => {
    const token = auth.getToken();
    if (!token) {
      router.push('/');
      return;
    }
    loadMessages(token);
  }, [conversationId, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      loadMessages(token);
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
      router.push('/dashboard');
    } catch (err) {
      alert('Failed to resolve conversation');
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <ChatHeader 
        onBack={() => router.push('/dashboard')} 
        onResolve={handleResolve} 
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
