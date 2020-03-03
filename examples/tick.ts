require("dotenv").config();
import { MekaClient } from "@meka-js/client";

// Declare Meka config using environment variables
const mekaConfig = {
  gameId: process.env.GAME_ID || "",
  apiUrl: process.env.MEKA_API_URL || "http://localhost:3000",
  webSocketUrl: process.env.MEKA_WEB_SOCKET_URL || "ws://localhost:3000",
  apiKey: process.env.MEKA_API_KEY || "",
  apiSecret: process.env.MEKA_API_SECRET || ""
};

// Print out the turn every tick
const doTick = (meka: MekaClient) => {
  console.log("Tick", meka.turn);
};

// Define meka object and set up tick event handler
const main = async () => {
  const meka = new MekaClient(mekaConfig);
  await meka.connect();
  const me = await meka.api.me();
  console.log("Hi!", me);
  meka.on("tick", () => doTick(meka));
};

// Call main function
main();
