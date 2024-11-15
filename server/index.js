const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const { Kafka } = require("kafkajs");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "http://localhost:5173" },
});

const PORT = 3001;

const kafka = new Kafka({
  clientId: "chat-app",
  brokers: ["localhost:9092"],
});
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "chat-group" });

let activeUsers = {};
let usernameToSocketId = {};

async function initializeKafka() {
  await producer.connect();
  await consumer.connect();
  await consumer.subscribe({ topic: "chat-messages", fromBeginning: true });

  consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const value = JSON.parse(message.value.toString());
        console.log("Mensagem consumida do Kafka:", value);

        io.emit("receive_message", value);
      } catch (error) {
        console.error("Erro ao processar mensagem do Kafka:", error);
      }
    },
  });
}

io.on("connection", (socket) => {
  console.log("Usuário conectado:", socket.id);

  socket.on("set_username", (username) => {
    if (Object.values(activeUsers).includes(username)) {
      socket.emit("username_taken", {
        message: "Nome de usuário já está em uso",
      });
    } else {
      activeUsers[socket.id] = username;
      usernameToSocketId[username] = socket.id;

      socket.emit("username_set", {
        message: "Nome de usuário configurado com sucesso",
      });

      const joinMessage = {
        text: `${username} entrou no chat.`,
        author: "Sistema",
        type: "system_message",
        timestamp: new Date().toISOString(),
      };

      producer.send({
        topic: "chat-messages",
        messages: [{ value: JSON.stringify(joinMessage) }],
      });

      io.emit("update_user_list", Object.values(activeUsers));
    }
  });

  socket.on("message", (text) => {
    const username = activeUsers[socket.id];
    if (!username) {
      socket.emit("error", {
        message: "Você precisa definir um nome de usuário primeiro",
      });
      return;
    }

    const message = {
      text,
      authorId: socket.id,
      author: username,
      timestamp: new Date().toISOString(),
      type: "public_message",
    };

    producer.send({
      topic: "chat-messages",
      messages: [{ value: JSON.stringify(message) }],
    });
  });

  socket.on("disconnect", () => {
    const username = activeUsers[socket.id];
    if (username) {
      delete activeUsers[socket.id];
      delete usernameToSocketId[username];

      const leaveMessage = {
        text: `${username} saiu do chat.`,
        author: "Sistema",
        type: "system_message",
        timestamp: new Date().toISOString(),
      };

      producer.send({
        topic: "chat-messages",
        messages: [{ value: JSON.stringify(leaveMessage) }],
      });

      io.emit("update_user_list", Object.values(activeUsers));
    }
  });
});

server.listen(PORT, async () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  await initializeKafka();
});
