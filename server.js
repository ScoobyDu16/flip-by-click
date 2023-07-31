import fs from "fs";
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { userConnected, userDisconnected } from "./sockets/user.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  const users = Array.from(io.sockets.sockets).map((socket) => socket[0]);

  userConnected(socket, users);
  socket.on("disconnect", () => userDisconnected(socket, users));

  socket.on("remove-room-user", ({ roomId, userId }) => {
    console.log("Removing user from the room ", roomId);

    let fileData = fs.readFileSync("data.json");
    fileData = JSON.parse(fileData);
    const roomUsers = fileData.roomUsers[roomId];
    fileData.roomUsers[roomId] = roomUsers.filter((item) => item !== userId);
    fs.writeFileSync("data.json", JSON.stringify(fileData));

    socket.emit("response-stats", { data: fileData });
    socket.broadcast.emit("response-stats", { data: fileData });
  });

  socket.on("request-stats", () => {
    let fileData = fs.readFileSync("data.json");
    fileData = JSON.parse(fileData);

    socket.emit("response-stats", { data: fileData });
    socket.broadcast.emit("response-stats", { data: fileData });
  });

  socket.on("reset-personal-stats", ({ userId }) => {
    let fileData = fs.readFileSync("data.json");
    fileData = JSON.parse(fileData);

    const userIndex = fileData.users.findIndex((user) => user.id === userId);
    if (userIndex >= 0) {
      fileData.users[userIndex].stats = { heads: 0, tails: 0 };
      fs.writeFileSync("data.json", JSON.stringify(fileData));
      socket.emit("response-stats", { data: fileData });
    }
  });

  socket.on("join-room", ({ roomId }) => {
    socket.join(roomId);
    socket.room = roomId;

    let fileData = fs.readFileSync("data.json");
    fileData = JSON.parse(fileData);
    if (fileData.roomUsers[roomId] === undefined) {
      fileData.roomUsers[roomId] = [];
    }
    fileData.roomUsers[roomId].push(socket.id);
    fs.writeFileSync("data.json", JSON.stringify(fileData));

    socket.to(roomId).emit("user-joined", fileData.roomUsers[roomId]);
    socket.emit("response-stats", { data: fileData });
    socket.broadcast.emit("response-stats", { data: fileData });

    console.log(`Users ${roomId} : ${fileData.roomUsers[roomId]}`);
  });

  socket.on("leave-room", ({ roomId }) => {
    let fileData = fs.readFileSync("data.json");
    fileData = JSON.parse(fileData);
    fileData.roomUsers[roomId] = fileData.roomUsers[roomId].filter(
      (userId) => userId !== socket.id
    );
    fs.writeFileSync("data.json", JSON.stringify(fileData));

    socket.to(roomId).emit("user-left", fileData.roomUsers[roomId]);
    socket.leave(roomId);
    socket.emit("response-stats", { data: fileData });
    socket.broadcast.emit("response-stats", { data: fileData });

    console.log(`Users ${roomId} : ${fileData.roomUsers[roomId]}`);
  });

  socket.on("toss-start", ({ roomId }) => {
    const tossResult = Math.random() < 0.5 ? "heads" : "tails";
    socket.to(roomId).emit("toss-started");

    let fileData = fs.readFileSync("data.json");
    fileData = JSON.parse(fileData);
    if (tossResult === "heads") {
      fileData.heads++;
    } else {
      fileData.tails++;
    }
    const currentUserIndex = fileData.users.findIndex(
      (user) => user.id === socket.id
    );
    if (currentUserIndex >= 0 && tossResult === "heads") {
      fileData.users[currentUserIndex].stats.heads++;
    } else if (currentUserIndex >= 0 && tossResult === "tails") {
      fileData.users[currentUserIndex].stats.tails++;
    }
    fs.writeFileSync("data.json", JSON.stringify(fileData));

    setTimeout(() => {
      socket.emit("send-toss-result", { tossResult });
      socket.to(roomId).emit("send-toss-result", { tossResult });

      socket.emit("response-stats", { data: fileData });
      socket.broadcast.emit("response-stats", { data: fileData });
    }, 1500);
  });
});

app.get("/", async (req, res) => {
  res.send("FlipByClick Server!");
});

server.listen(PORT, () => {
  console.log("Flip-by-click server started on PORT : ", PORT);
});
