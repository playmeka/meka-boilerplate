import * as program from "commander";
import { MekaClient } from "@meka-js/client";
import requireEnv from "../utils/requireEnv";

// Print out the turn every tick
const doTick = (meka: MekaClient) => {
  console.log("Tick", meka.turn);
};

program
  .command("tick <gameId>")
  .description("start MEKA tick for given game ID")
  .action(async (gameId: string) => {
    // Declare Meka config using environment variables
    const mekaConfig = {
      apiKey: requireEnv("MEKA_API_KEY"),
      apiSecret: requireEnv("MEKA_API_SECRET"),
      apiUrl: requireEnv("MEKA_API_URL", "https://api.meka.gg"),
      webSocketUrl: requireEnv("MEKA_WEB_SOCKET_URL", "wss://api.meka.gg")
    };
    const meka = new MekaClient({ ...mekaConfig, gameId });
    await meka.connect();
    const me = await meka.api.me();
    console.log("Hi!", me);
    meka.on("tick", () => doTick(meka));
  });

program.parse(process.argv);
