import fs from "fs";

export const userConnected = (socket, users) => {
  console.log("Connected User : ", socket.id);
  console.log(users);

  let fileData = fs.readFileSync("data.json");
  fileData = JSON.parse(fileData);
  fileData.users.push({ id: socket.id, stats: { heads: 0, tails: 0 } });
  fileData.users= fileData.users.filter(user => users.includes(user.id))
  fs.writeFileSync("data.json", JSON.stringify(fileData));

  socket.emit("current-user", { userId: socket.id });
  socket.emit("response-stats", { data: fileData });
  socket.broadcast.emit("response-stats", { data: fileData });
};

export const userDisconnected = (socket, users) => {
  users = users.filter((user) => user !== socket.id);
  let fileData = fs.readFileSync("data.json");
  fileData = JSON.parse(fileData);

  for (const room in fileData.roomUsers) {
    if (fileData.roomUsers.hasOwnProperty(room)) {
      fileData.roomUsers[room] = fileData.roomUsers[room].filter(
        (user) => user !== socket.id
      );
    }
  }

  fileData.users = fileData.users.filter((user) => user.id !== socket.id);
  fs.writeFileSync("data.json", JSON.stringify(fileData));

  socket.broadcast.emit("response-stats", { data: fileData });

  console.log("Disconnected User : ", socket.id);
  console.log(users);
};
