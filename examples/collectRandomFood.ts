require("dotenv").config();
import { Citizen, DropOffFoodCommand, PickUpFoodCommand } from "@meka-js/core";
import { MekaClient } from "@meka-js/client";

// Declare Meka config using environment variables
const mekaConfig = {
  gameId: process.env.GAME_ID || "",
  apiUrl: process.env.MEKA_API_URL || "http://localhost:3000",
  webSocketUrl: process.env.MEKA_WEB_SOCKET_URL || "ws://localhost:3000",
  apiKey: process.env.MEKA_API_KEY || "",
  apiSecret: process.env.MEKA_API_SECRET || ""
};

// Tell citizen to collect random food
const collectRandomFood = (meka: MekaClient, citizen: Citizen) => {
  // Do nothing if unit is currently busy
  if (meka.unitIsBusy(citizen)) return;
  // Check if citizen currently has picked up a food
  if (citizen.food) {
    // Create a command to have the citizen drop-off the food at the HQ
    const dropOffHQ = citizen.team.hq;
    const command = new DropOffFoodCommand({
      unit: citizen,
      args: { hqId: dropOffHQ.id }
    });
    // Send the drop-off command to the game engine
    meka.sendCommand(command);
    console.log("Sent command", command);
  } else {
    // Select a random food from the map
    const randomFoodIndex = Math.floor(
      Math.random() * meka.game.foodsList.length
    );
    const randomFood = meka.game.foodsList[randomFoodIndex];
    // Create a command to have the citizen pick-up the random food
    const command = new PickUpFoodCommand({
      unit: citizen,
      args: { foodId: randomFood.id }
    });
    // Send the pick-up command to the game engine
    meka.sendCommand(command);
    console.log("Sent command", command);
  }
};

// Print out the turn every tick
const doTick = (meka: MekaClient, teamId: string) => {
  const team = meka.game.getTeam(teamId);
  team.citizens.forEach(citizen => collectRandomFood(meka, citizen));
};

// Define meka object and set up tick event handler
const main = async () => {
  const meka = new MekaClient(mekaConfig);
  await meka.connect();
  const me = await meka.api.me();
  const teamId = me.uid;
  meka.on("tick", () => doTick(meka, teamId));
};

// Call main function
main();
