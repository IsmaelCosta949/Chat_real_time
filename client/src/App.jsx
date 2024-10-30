import { useState } from "react";
import "./App.css";
import Chat from "./components/Chat/Chat";
import Join from "./components/Join/Join";

function App() {
  const [chatVisibility, setChatVisibility] = useState(false);
  const [socket, setSocket] = useState(null);

  return (
    <div className="App">
      {chatVisibility ? (
        <Chat socket={socket} />
      ) : (
        <Join setSocket={setSocket} setChatVisibility={setChatVisibility} />
      )}
    </div>
  );
}

export default App;
