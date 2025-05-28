const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const ACTIONS = require("./Actions");

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET","POST"] } });

// track username by socket
const userSocketMap = {};
// track which socket is host for each room
const roomHosts = {};

const getAllConnectedClients = roomId =>
  Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(socketId => ({
    socketId,
    username: userSocketMap[socketId]
  }));

io.on("connection", socket => {
  // 1) Host enters
  socket.on(ACTIONS.HOST_JOIN, ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    roomHosts[roomId] = socket.id;
    socket.join(roomId);
    console.log(`Host ${username} (${socket.id}) created room ${roomId}`);
  });

  // 2) Participant requests to join
  socket.on(ACTIONS.REQUEST_JOIN, ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    const hostId = roomHosts[roomId];
    if (hostId) {
      console.log(`Participant ${username} requests to join ${roomId}`);
      io.to(hostId).emit(ACTIONS.JOIN_REQUEST, { socketId: socket.id, username });
    } else {
      // no host => auto reject
      socket.emit(ACTIONS.JOIN_REJECTED);
    }
  });

  // 3) Host approves
  socket.on(ACTIONS.APPROVE_JOIN, ({ roomId, socketId }) => {
    const client = io.sockets.sockets.get(socketId);
    if (client) {
      client.join(roomId);
      console.log(`Host approved ${userSocketMap[socketId]} (${socketId})`);
      // notify that client was approved
      io.to(socketId).emit(ACTIONS.JOIN_APPROVED);

      // broadcast new member list
      const clients = getAllConnectedClients(roomId);
      clients.forEach(({ socketId }) => {
        io.to(socketId).emit(ACTIONS.JOINED, { clients, username: userSocketMap[socket.id], socketId });
      });
    }
  });

  // 4) Host rejects
  socket.on(ACTIONS.REJECT_JOIN, ({ socketId }) => {
    console.log(`Host rejected request for ${socketId}`);
    io.to(socketId).emit(ACTIONS.JOIN_REJECTED);
  });

  // 5) Code sync events
  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });
  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  // 6) Handle disconnect
  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    rooms.forEach(roomId => {
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id]
      });
    });
    delete userSocketMap[socket.id];
    socket.leave();
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
