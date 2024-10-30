const app = require("express")();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: { origin: "http://localhost:5173" },
});

const PORT = 3001;
const activeUsers = new Set(); // Usar um Set para manter nomes de usuários únicos
const messageHistory = []; // Array para armazenar o histórico de mensagens

io.on("connection", (socket) => {
  console.log("Usuário conectado!", socket.id);

  // Enviar histórico de mensagens mas nao funciona
  socket.emit("message_history", messageHistory);

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

      // Mensagem de entrada no chat
      const joinMessage = {
        text: `${username} entrou no chat.`,
        author: "Sistema",
        type: "system_message",
        timestamp: new Date().toISOString(),
      };
      messageHistory.push(joinMessage);
      io.emit("receive_message", joinMessage);
      io.emit("update_user_list", Array.from(activeUsers));
    }
  });

  // Quando um usuário envia uma mensagem
  socket.on("message", (text) => {
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
    messageHistory.push(message); // Salvar a mensagem mas nao funciona
    io.emit("receive_message", message);
  });

  // Quando um usuário está digitando
  socket.on("typing", () => {
    if (socket.data.username) {
      socket.broadcast.emit("user_typing", {
        username: socket.data.username,
      });
    }
  });

  // Quando um usuário para de digitar
  socket.on("stop_typing", () => {
    if (socket.data.username) {
      socket.broadcast.emit("user_stopped_typing", {
        username: socket.data.username,
      });
    }
  });

  // Quando um usuário se desconecta
  socket.on("disconnect", () => {
    console.log("Usuário desconectado!", socket.id);
    if (socket.data.username) {
      activeUsers.delete(socket.data.username);

      const leaveMessage = {
        text: `${socket.data.username} saiu do chat.`,
        author: "Sistema",
        type: "system_message",
        timestamp: new Date().toISOString(),
      };
      messageHistory.push(leaveMessage);
      io.emit("receive_message", leaveMessage);

      io.emit("update_user_list", Array.from(activeUsers));
    }
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
