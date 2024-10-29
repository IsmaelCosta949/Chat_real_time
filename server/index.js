const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const redis = require("redis");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:5173" },
});

const PORT = 3001;
const activeUsers = new Set();
const redisClient = redis.createClient(); // Criar cliente Redis

// Conectar ao Redis
redisClient.connect().catch(console.error);

io.on("connection", async (socket) => {
  console.log("Usuário conectado!", socket.id);

  // Carregar histórico de mensagens do Redis quando o usuário se conecta
  try {
    const messageHistory = await redisClient.get("messageHistory");
    const parsedHistory = messageHistory ? JSON.parse(messageHistory) : [];
    socket.emit("message_history", parsedHistory);
  } catch (err) {
    console.error("Erro ao carregar o histórico de mensagens:", err);
  }

  // Quando um usuário define seu nome de usuário
  socket.on("set_username", (username) => {
    if (activeUsers.has(username)) {
      socket.emit("username_taken", {
        message: "Nome de usuário já está em uso",
      });
    } else {
      socket.data.username = username;
      activeUsers.add(username);
      socket.emit("username_set", {
        message: "Nome de usuário configurado com sucesso",
      });
      io.emit("update_user_list", Array.from(activeUsers));
    }
  });

  // Quando um usuário envia uma mensagem
  socket.on("message", async (text) => {
    if (!socket.data.username) {
      socket.emit("error", {
        message: "Você precisa definir um nome de usuário primeiro",
      });
      return;
    }

    const message = {
      text,
      authorId: socket.id,
      author: socket.data.username,
      timestamp: new Date().toISOString(),
    };

    // Armazena a mensagem no Redis
    try {
      const messageHistory = await redisClient.get("messageHistory");
      const parsedHistory = messageHistory ? JSON.parse(messageHistory) : [];
      parsedHistory.push(message);
      await redisClient.set("messageHistory", JSON.stringify(parsedHistory));
      io.emit("receive_message", message);
    } catch (err) {
      console.error("Erro ao salvar a mensagem no Redis:", err);
    }
  });

  // Quando um usuário se desconecta
  socket.on("disconnect", () => {
    console.log("Usuário desconectado!", socket.id);
    if (socket.data.username) {
      activeUsers.delete(socket.data.username);
      io.emit("update_user_list", Array.from(activeUsers));
    }
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
