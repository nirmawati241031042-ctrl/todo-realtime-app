const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(express.static("public"));

const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

app.get("/health", (req, res) => res.json({ ok: true }));

// ===== Simpan data per room (in-memory) =====
const rooms = new Map(); // roomId -> { todos: [] }
function getRoom(roomId) {
  if (!rooms.has(roomId)) rooms.set(roomId, { todos: [] });
  return rooms.get(roomId);
}

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // ===== ROOM JOIN =====
  socket.on("room:join", ({ roomId, user }) => {
    const rid = String(roomId || "demo").trim();
    const uname = String(user || "Anonymous").trim();

    socket.join(rid);
    socket.data.roomId = rid;
    socket.data.user = uname;

    console.log(`${uname} joined room: ${rid}`);

    const room = getRoom(rid);
    socket.emit("todos:sync", { todos: room.todos });
    socket.emit("room:joined", { roomId: rid, user: uname });
  });

  // ===== TODO: ADD =====
  socket.on("todo:add", ({ roomId, text }) => {
    const rid = String(roomId || socket.data.roomId || "demo").trim();
    const t = String(text || "").trim();
    if (!t) return;

    const room = getRoom(rid);

    const todo = {
      id: Date.now().toString(),
      text: t,
      done: false,
    };

    room.todos.unshift(todo);
    io.to(rid).emit("todos:sync", { todos: room.todos });
  });

  // ===== TODO: TOGGLE =====
  socket.on("todo:toggle", ({ roomId, id }) => {
    const rid = String(roomId || socket.data.roomId || "demo").trim();
    const room = getRoom(rid);

    room.todos = room.todos.map((x) =>
      x.id === id ? { ...x, done: !x.done } : x
    );

    io.to(rid).emit("todos:sync", { todos: room.todos });
  });

  // ===== TODO: EDIT =====
  socket.on("todo:edit", ({ roomId, id, text }) => {
    const rid = String(roomId || socket.data.roomId || "demo").trim();
    const t = String(text || "").trim();
    if (!t) return;

    const room = getRoom(rid);

    room.todos = room.todos.map((x) =>
      x.id === id ? { ...x, text: t } : x
    );

    io.to(rid).emit("todos:sync", { todos: room.todos });
  });

  // ===== TODO: DELETE =====
  socket.on("todo:delete", ({ roomId, id }) => {
    const rid = String(roomId || socket.data.roomId || "demo").trim();
    const room = getRoom(rid);

    room.todos = room.todos.filter((x) => x.id !== id);
    io.to(rid).emit("todos:sync", { todos: room.todos });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
