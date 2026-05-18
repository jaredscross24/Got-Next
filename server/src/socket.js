const { Server } = require('socket.io');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    socket.on('join_court', (courtId) => {
      socket.join(`court:${courtId}`);
    });

    socket.on('leave_court', (courtId) => {
      socket.leave(`court:${courtId}`);
    });
  });

  return io;
}

function getIo() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

module.exports = { initSocket, getIo };
