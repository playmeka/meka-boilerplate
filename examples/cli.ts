require("dotenv").config();
import * as program from "commander";
import { MekaClient } from "@meka-js/client";

// Declare Meka config using environment variables
const mekaConfig = {
  apiUrl: process.env.MEKA_API_URL || "http://localhost:3000",
  webSocketUrl: process.env.MEKA_WEB_SOCKET_URL || "ws://localhost:3000",
  apiKey: process.env.MEKA_API_KEY || "",
  apiSecret: process.env.MEKA_API_SECRET || ""
};

// Print out the turn every tick
const doTick = (meka: MekaClient) => {
  console.log("Tick", meka.turn);
};

program
  .command("tick <gameId>")
  .description("start MEKA tick for given game ID")
  .action(async (gameId: string) => {
    const meka = new MekaClient({ ...mekaConfig, gameId });
    await meka.connect();
    const me = await meka.api.me();
    console.log("Hi!", me);
    meka.on("tick", () => doTick(meka));
  });

program.parse(process.argv);
