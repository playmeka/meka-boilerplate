require("dotenv").config();
import { Team, SpawnCommand, FighterClassName } from "@meka-js/core";
import { MekaClient } from "@meka-js/client";

// Declare Meka config using environment variables
const mekaConfig = {
  gameId: process.env.GAME_ID || "",
  apiUrl: process.env.MEKA_API_URL || "http://localhost:3000",
  webSocketUrl: process.env.MEKA_WEB_SOCKET_URL || "ws://localhost:3000",
  apiKey: process.env.MEKA_API_KEY || "",
  apiSecret: process.env.MEKA_API_SECRET || ""
};

const spawnCitizen = (meka: MekaClient, team: Team) => {
  // Make sure team has enough food to pay for citizen
  if (team.foodCount < team.settings.cost.Citizen) {
    console.log("Not enough food for a citizen!");
    return;
  }
  // Create SpawnCommand
  const command = new SpawnCommand({
    unit: team.hq,
    args: { unitType: "Citizen" }
  });
  meka.sendCommand(command);
  console.log("Sent command", command);
};

const spawnRandomFighter = (meka: MekaClient, team: Team) => {
  // Randomly select a fighter type
  const fighterTypes: FighterClassName[] = [
    "InfantryFighter",
    "RangedFighter",
    "CavalryFighter"
  ];
  const fighterType =
    fighterTypes[Math.floor(Math.random() * fighterTypes.length)];
  // Make sure team has enough food for fighter
  if (team.foodCount < team.settings.cost[fighterType]) {
    console.log(`Not enough food for ${fighterType}`);
    return;
  }
  // Create SpawnCommand
  const command = new SpawnCommand({
    unit: team.hq,
    args: { unitType: fighterType }
  });
  meka.sendCommand(command);
  console.log("Sent command", command);
};

// Print out the turn every tick
const doTick = (meka: MekaClient, teamId: string) => {
  const team = meka.game.getTeam(teamId);
  const citizenCount = team.citizens.length;
  if (citizenCount < 2) {
    // Spawn citizen
    spawnCitizen(meka, team);
  } else {
    spawnRandomFighter(meka, team);
  }
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
