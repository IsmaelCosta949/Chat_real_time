import { Button, Input } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import style from "./Join.module.css";

export default function Join({ setChatVisibility, setSocket }) {
  const usernameRef = useRef();
  const [error, setError] = useState(null);
  const [input, setInput] = useState("");

  const handleSubmit = async () => {
    const username = usernameRef.current.value;
    if (!username.trim()) return;
    const socket = await io.connect("http://localhost:3001");

    socket.emit("set_username", username);

    socket.on("username_taken", () => {
      setError("Nome de usuário já está em uso");
      socket.disconnect();
    });

    socket.on("username_set", () => {
      setError(null);
      setSocket(socket);
      setChatVisibility(true);
    });
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
          inputRef={usernameRef}
          placeholder="Nome de usuário"
          value={input}
          fullWidth
          onChange={(e) => setInput(e.target.value)}
        />
        {error && <p className={style["error-message"]}>{error}</p>}
        <Button
          fullWidth
          sx={{ mt: 2 }}
          onClick={() => handleSubmit()}
          variant="contained"
        >
          Entrar
        </Button>
      </div>
      {/* <div className={style["logo"]}>
        <img
          src="https://wallpapers.com/images/hd/discord-pictures-jk6hbod6g5686ag3.jpg"
          alt=""
          className={style["logo-img"]}
        />
      </div> */}
    </div>
  );
}
