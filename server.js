const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const socketIo = require("socket.io");

const Document = require("./models/Document");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = socketIo(server, { cors: { origin: "*" } });

mongoose.connect("mongodb://127.0.0.1:27017/collab-editor");

const defaultValue = "";

io.on("connection", (socket) => {
  socket.on("get-document", async (docId) => {
    const doc = await findOrCreate(docId);

    socket.join(docId);
    socket.emit("load-document", doc.data);

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(docId).emit("receive-changes", delta);
    });

    socket.on("save-document", async (data) => {
      await Document.findByIdAndUpdate(docId, { data });
    });
  });
});

async function findOrCreate(id) {
  let doc = await Document.findById(id);
  if (doc) return doc;
  return await Document.create({ _id: id, data: defaultValue });
}

server.listen(5000, () => console.log("Server running on 5000"));
