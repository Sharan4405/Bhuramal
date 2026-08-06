"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, auth } from "@/lib/api";
import { AdminNav } from "@/components/dashboard/AdminNav";
import { ConversationCard } from "@/components/dashboard/ConversationCard";

interface Conversation {
  _id: string;
  user: string;
  status: "OPEN" | "RESOLVED";
  lastMessage: string;
  lastMessageAt: string;
  currentFlow: string;
  state?: string;
}

const PAGE_SIZE = 15;

export default function DashboardPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const router = useRouter();

  const loadConversations = useCallback(
    async (token: string) => {
      try {
        const data = await api.getConversations(token);

        // Latest conversation first
        const sortedConversations = [...data.conversations].sort(
          (a: Conversation, b: Conversation) =>
            new Date(b.lastMessageAt).getTime() -
            new Date(a.lastMessageAt).getTime(),
        );

        setConversations(sortedConversations);
        setCurrentPage(1);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";

        console.error("Failed to fetch conversations:", err);
        console.error("Error details:", errorMessage);

        if (
          errorMessage?.includes("401") ||
          errorMessage?.includes("Unauthorized")
        ) {
          auth.removeToken();
          router.push("/");
        }
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    const token = auth.getToken();

    if (!token) {
      router.push("/");
      return;
    }

    loadConversations(token);
  }, [router, loadConversations]);

  // Pagination
  const totalPages = Math.ceil(conversations.length / PAGE_SIZE);

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;

  const currentConversations = conversations.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  return (
    <>
      <AdminNav />

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              All Conversations
            </h1>

            <p className="text-base text-gray-600">
              Manage customer conversations and chats in real-time
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(var(--orange))]"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm text-center py-16 px-4">
              <svg
                className="mx-auto h-16 w-16 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>

              <p className="text-gray-500 text-lg font-medium">
                No conversations found
              </p>

              <p className="text-gray-400 text-sm mt-2">
                New conversations will appear here
              </p>
            </div>
          ) : (
            <>
              {/* Conversation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentConversations.map((conv) => (
                  <ConversationCard
                    key={conv._id}
                    conversation={conv}
                    onClick={() => router.push(`/dashboard/chat/${conv._id}`)}
                    showStatus={conv.status === "OPEN"}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-lg border border-gray-200 px-5 py-4">
                  {/* Showing info */}
                  <div className="text-sm text-gray-600">
                    Showing{" "}
                    <span className="font-semibold text-gray-900">
                      {startIndex + 1}
                    </span>{" "}
                    -{" "}
                    <span className="font-semibold text-gray-900">
                      {Math.min(endIndex, conversations.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-gray-900">
                      {conversations.length}
                    </span>{" "}
                    conversations
                  </div>

                  {/* Pagination buttons */}
                  <div className="flex items-center gap-2">
                    {/* Previous */}
                    <button
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      ← Previous
                    </button>

                    {/* Page number */}
                    <div className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold">
                      {currentPage} / {totalPages}
                    </div>

                    {/* Next */}
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
