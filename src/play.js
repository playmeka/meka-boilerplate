require("dotenv").config();
import MekaClient from "@meka-js/client";

// Meka config
const gameId = process.env.GAME_ID || "";
const apiUrl = process.env.MEKA_API_URL || "http://localhost:3000";
const websocketUrl = process.env.MEKA_WEB_SOCKET_URL || "ws://localhost:3000";
const apiKey = process.env.MEKA_API_KEY || "";
const apiSecret = process.env.MEKA_API_SECRET || "";

const doWork = () => {
  const meka = new MekaClient({ gameId, apiKey, apiSecret });
  meka
    .connect()
    .then(() => {
      console.log("Connected to MEKA", meka);
    })
    .catch(err => {
      console.error(err);
    });
};

doWork();
