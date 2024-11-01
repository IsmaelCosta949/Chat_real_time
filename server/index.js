// server.js
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const socketIo = require("socket.io");
const io = socketIo(server, {
  cors: { origin: "http://localhost:5173" },
});

const fs = require("fs"); // tentei usar isso para salvar as mensagens porem deu algum erro e não consegui resolver entao vai ter ele espalhado no codigo
const path = require("path");

const PORT = 3001;
let activeUsers = {};
let usernameToSocketId = {};

const MESSAGE_HISTORY_FILE = path.join(__dirname, "messageHistory.json");

let messageHistory = [];
if (fs.existsSync(MESSAGE_HISTORY_FILE)) {
  const data = fs.readFileSync(MESSAGE_HISTORY_FILE, "utf8");
  messageHistory = JSON.parse(data);
} else {
  messageHistory = [];
}

function saveMessageHistory() {
  fs.writeFileSync(MESSAGE_HISTORY_FILE, JSON.stringify(messageHistory));
}

io.on("connection", (socket) => {
  console.log("Usuário conectado!", socket.id);

  socket.emit("message_history", messageHistory);

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
      messageHistory.push(joinMessage);
      saveMessageHistory();

      io.emit("receive_message", joinMessage);

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

    if (text.startsWith("/private ")) {
      const splitText = text.split(" ");
      const targetUsername = splitText[1];
      const privateMessageText = splitText.slice(2).join(" ");

      if (targetUsername && privateMessageText) {
        const targetSocketId = usernameToSocketId[targetUsername];
        if (targetSocketId) {
          const privateMessage = {
            text: privateMessageText,
            authorId: socket.id,
            author: username,
            timestamp: new Date().toISOString(),
            type: "private_message",
            to: targetUsername,
          };

          socket.emit("receive_message", privateMessage);

          io.to(targetSocketId).emit("receive_message", privateMessage);

          messageHistory.push(privateMessage);
          saveMessageHistory();
        } else {
          socket.emit("error", {
            message: `Usuário ${targetUsername} não encontrado`,
          });
        }
      } else {
        socket.emit("error", {
          message: "Formato incorreto. Use: /private nome_usuario mensagem",
        });
      }
    } else {
      const message = {
        text,
        authorId: socket.id,
        author: username,
        timestamp: new Date().toISOString(),
        type: "public_message",
      };
      messageHistory.push(message);
      saveMessageHistory();
      io.emit("receive_message", message);
    }
  });

  socket.on("typing", () => {
    const username = activeUsers[socket.id];
    if (username) {
      socket.broadcast.emit("user_typing", { username });
    }
  });

  socket.on("stop_typing", () => {
    const username = activeUsers[socket.id];
    if (username) {
      socket.broadcast.emit("user_stopped_typing", { username });
    }
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
      messageHistory.push(leaveMessage);
      saveMessageHistory();

      io.emit("receive_message", leaveMessage);

      // Atualizar lista de usuários para todos os clientes
      io.emit("update_user_list", Object.values(activeUsers));
    }
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
