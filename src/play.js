import MekaClient from "@meka-js/client";

const doTick = game => {
  console.log("TICK", game.turn);
  // Your code here
};

// Fill in details
const gameUid = "test";
const websocketUrl = "ws://localhost:8000";

const meka = new MekaClient({
  gameUid,
  websocketUrl,
  onTick: doTick
});

console.log("Started Meka client", meka);
