'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, auth } from '@/lib/api';
import { DashboardHeader } from '@/components/dashboard/Header';
import { FilterButtons } from '@/components/dashboard/FilterButtons';
import { ConversationCard } from '@/components/dashboard/ConversationCard';

interface Conversation {
  _id: string;
  user: string;
  status: 'OPEN' | 'RESOLVED';
  lastMessage: string;
  lastMessageAt: string;
  currentFlow: string;
}

export default function DashboardPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('OPEN');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = auth.getToken();
    if (!token) {
      router.push('/');
      return;
    }
    loadConversations(token);
  }, [filter, router]);

  const loadConversations = async (token: string) => {
    try {
      const status = filter === 'ALL' ? undefined : filter;
      const data = await api.getConversations(token, status);
      setConversations(data.conversations);
    } catch (err) {
      console.error(err);
      auth.removeToken();
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const token = auth.getToken();
    if (token) {
      await api.logout(token);
    }
    auth.removeToken();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto p-8">
        <FilterButtons currentFilter={filter} onFilterChange={setFilter} />

        {loading ? (
          <div className="text-center py-12 text-gray-600">
            Loading...
          </div>
        ) : conversations.length === 0 ? (
          <div className="card text-center py-12 text-gray-600">
            No conversations found
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {conversations.map((conv) => (
              <ConversationCard
                key={conv._id}
                conversation={conv}
                onClick={() => router.push(`/dashboard/chat/${conv._id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
