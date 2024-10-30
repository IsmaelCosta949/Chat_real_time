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
  const [activeUsers, setActiveUsers] = useState([]);

  useEffect(() => {
    socket.on("message_history", (history) => {
      setMessageList(history);
    });

    socket.on("receive_message", (data) => {
      setMessageList((current) => [...current, data]);
    });

    socket.on("user_typing", ({ username }) => {
      setUserTyping(username);
    });

    socket.on("user_stopped_typing", () => {
      setUserTyping(null);
    });

    socket.on("update_user_list", (users) => {
      setActiveUsers(users);
    });

    return () => {
      socket.off("message_history");
      socket.off("receive_message");
      socket.off("user_typing");
      socket.off("user_stopped_typing");
      socket.off("update_user_list");
    };
  }, [socket]);

  useEffect(() => {
    scrollDown();
  }, [messageList]);

  const handleInputChange = () => {
    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing");
    }
  };

  const handleSubmit = () => {
    const message = messageRef.current.value;
    if (!message.trim()) return;

    socket.emit("message", message);
    clearInput();
    focusInput();
    setIsTyping(false);
    socket.emit("stop_typing");
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
    <div className={style["tela-cheia"]}>
      <div className={style["box-lateral"]}>
        <h3>Usuários ativos</h3>
        <ul>
          {activeUsers.map((user, index) => (
            <li key={index}>{user}</li>
          ))}
        </ul>
      </div>
      <div className={style["chat-container"]}>
        <div className={style["chat-body"]}>
          {messageList.map((message, index) => (
            <div
              key={index}
              className={`${style["message-container"]} ${
                message.authorId === socket.id && style["message-mine"]
              } ${
                message.type === "system_message" && style["system-message"]
              }`}
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
