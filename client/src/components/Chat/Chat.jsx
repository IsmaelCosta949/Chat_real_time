import SendIcon from "@mui/icons-material/Send";
import { Input } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import style from "./Chat.module.css";

export default function Chat({ socket }) {
  const bottomRef = useRef();
  const messageRef = useRef();
  const [messageList, setMessageList] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [userTyping, setUserTyping] = useState(null);

  useEffect(() => {
    // Receber histórico de mensagens quando o componente é montado
    socket.on("message_history", (history) => {
      setMessageList(history);
    });

    // Receber novas mensagens em tempo real
    socket.on("receive_message", (data) => {
      setMessageList((current) => [...current, data]);
    });

    // Receber notificação de digitação
    socket.on("user_typing", ({ username, isTyping }) => {
      if (isTyping) {
        setUserTyping(username);
      } else {
        setUserTyping(null);
      }
    });

    // Limpar listeners quando o componente é desmontado
    return () => {
      socket.off("message_history");
      socket.off("receive_message");
      socket.off("user_typing");
    };
  }, [socket]);

  useEffect(() => {
    scrollDown();
  }, [messageList]);

  const handleInputChange = () => {
    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", true);
    }

    // Parar de notificar digitação após um pequeno atraso de inatividade
    setTimeout(() => {
      setIsTyping(false);
      socket.emit("typing", false);
    }, 2000);
  };

  const handleSubmit = () => {
    const message = messageRef.current.value;
    if (!message.trim()) return;

    socket.emit("message", message);
    clearInput();
    focusInput();
    socket.emit("typing", false); // Parar notificação de digitação ao enviar
  };

  const clearInput = () => {
    messageRef.current.value = "";
  };

  const focusInput = () => {
    messageRef.current.focus();
  };

  const getEnterKey = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  const scrollDown = () => {
    bottomRef.current.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div>
      <div className={style["chat-container"]}>
        <div className={style["chat-body"]}>
          {messageList.map((message, index) => (
            <div
              className={`${style["message-container"]} ${
                message.authorId === socket.id && style["message-mine"]
              }`}
              key={index}
            >
              <div className="message-author">
                <strong>{message.author}</strong>
              </div>
              <div className="message-text">{message.text}</div>
            </div>
          ))}
          <div ref={bottomRef} />
          {userTyping && (
            <div className={style["typing-notification"]}>
              {userTyping} está digitando...
            </div>
          )}
        </div>
        <div className={style["chat-footer"]}>
          <Input
            inputRef={messageRef}
            placeholder="Mensagem"
            onKeyDown={(e) => getEnterKey(e)}
            onChange={handleInputChange}
            fullWidth
          />
          <SendIcon
            sx={{ m: 1, cursor: "pointer" }}
            onClick={() => handleSubmit()}
            color="primary"
          />
        </div>
      </div>
    </div>
  );
}
