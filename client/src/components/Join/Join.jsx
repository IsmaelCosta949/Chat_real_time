import { Button, Input } from "@mui/material";
import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import style from "./Join.module.css";

export default function Join({ setChatVisibility, setSocket }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(null);
  const [socketInstance, setSocketInstance] = useState(null);

  useEffect(() => {
    const socket = io("http://localhost:3001");

    socket.on("username_taken", ({ message }) => {
      setError(message);
    });

    socket.on("username_set", () => {
      setError(null);
      setSocket(socket);
      setChatVisibility(true);
    });

    socket.on("error", ({ message }) => {
      setError(message);
    });

    setSocketInstance(socket);

    return () => {
      socket.off("username_taken");
      socket.off("username_set");
      socket.off("error");
    };
  }, [setSocket, setChatVisibility]);

  const handleSubmit = () => {
    const username = input.trim();
    if (!username) {
      setError("Por favor, insira um nome de usuário");
      return;
    }

    socketInstance.emit("set_username", username);
  };

  useEffect(() => {
    if (error) {
      setError(null);
    }
  }, [input]);

  return (
    <div className={style["tela-cheia"]}>
      <div className={style["join-container"]}>
        <h2>Chat em tempo real</h2>
        <Input
          placeholder="Nome de usuário"
          value={input}
          fullWidth
          onChange={(e) => setInput(e.target.value)}
        />
        {error && <p className={style["error-message"]}>{error}</p>}
        <Button
          fullWidth
          sx={{ mt: 2 }}
          onClick={handleSubmit}
          variant="contained"
        >
          Entrar
        </Button>
      </div>
    </div>
  );
}
