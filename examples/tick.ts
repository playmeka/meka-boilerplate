import { MekaClient } from "@meka-js/client";
import requireEnv from "../utils/requireEnv";

// Print out the turn every tick
const doTick = (meka: MekaClient) => {
  console.log("Tick", meka.turn);
};

// Define meka object and set up tick event handler
const main = async () => {
  try {
    // Declare Meka config using environment variables
    const mekaConfig = {
      gameId: requireEnv("GAME_ID"),
      apiKey: requireEnv("MEKA_API_KEY"),
      apiSecret: requireEnv("MEKA_API_SECRET"),
      apiUrl: requireEnv("MEKA_API_URL", "https://api.meka.gg"),
      webSocketUrl: requireEnv("MEKA_WEB_SOCKET_URL", "wss://api.meka.gg")
    };
    const meka = new MekaClient(mekaConfig);
    await meka.connect();
    const me = await meka.api.me();
    console.log("Hi!", me);
    meka.on("tick", () => doTick(meka));
  } catch (err) {
    console.log(err.message);
  }
};

// Call main function
main();
