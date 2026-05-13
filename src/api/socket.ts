import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_BACK_END || "http://localhost:3000";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket"], 
});
