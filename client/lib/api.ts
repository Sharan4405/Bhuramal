const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Helper function with timeout
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - please check if backend server is running');
    }
    throw error;
  }
};

export const api = {
  // Auth
  login: async (username: string, password: string) => {
    const res = await fetchWithTimeout(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(errorData.error || 'Login failed');
    }
    return res.json();
  },

  logout: async (token: string) => {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Conversations
  getConversations: async (token: string, status?: string) => {
    const url = status 
      ? `${API_URL}/api/conversations?status=${status}`
      : `${API_URL}/api/conversations`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch conversations: ${res.status} - ${errorText}`);
    }
    return res.json();
  },

  // Messages
  async getMessages(token: string, conversationId: string) {
    const res = await fetch(`${API_URL}/api/conversations/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch messages');
    return res.json();
  },

  sendMessage: async (token: string, conversationId: string, text: string) => {
    const res = await fetch(`${API_URL}/api/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ conversationId, text }),
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
  },

  resolveConversation: async (token: string, conversationId: string) => {
    const res = await fetch(`${API_URL}/api/conversations/${conversationId}/resolve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to resolve conversation');
    return res.json();
  },

  reopenConversation: async (token: string, conversationId: string) => {
    const res = await fetch(`${API_URL}/api/conversations/${conversationId}/reopen`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to reopen conversation');
    return res.json();
  },
};

export const auth = {
  getToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  },
  
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  },
  
  removeToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  },
  
  isAuthenticated: () => {
    return !!auth.getToken();
  },
};
