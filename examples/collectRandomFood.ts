import { Citizen, DropOffFoodCommand, PickUpFoodCommand } from "@meka-js/core";
import { MekaClient } from "@meka-js/client";
import requireEnv from "../utils/requireEnv";

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
    const teamId = me.uid;
    meka.on("tick", () => doTick(meka, teamId));
  } catch (err) {
    console.log(err.message);
  }
};

// Call main function
main();
