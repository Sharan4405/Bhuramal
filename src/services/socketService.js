import { Server } from 'socket.io';

let io = null;

export function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('📡 Dashboard client connected:', socket.id);

    // Admin joins a conversation room to receive updates
    socket.on('join-conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`👤 Admin joined conversation: ${conversationId}`);
    });

    // Admin leaves a conversation room
    socket.on('leave-conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`👋 Admin left conversation: ${conversationId}`);
    });

    socket.on('disconnect', () => {
      console.log('📴 Dashboard client disconnected:', socket.id);
    });
  });

  return io;
}

// Emit new incoming message to dashboard
export function notifyNewMessage(conversationId, message) {
  if (!io) return;
  
  io.to(`conversation:${conversationId}`).emit('new-message', message);
  console.log(`📨 Notified dashboard about new message in ${conversationId}`);
}

export function getIO() {
  return io;
}
