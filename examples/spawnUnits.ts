import { Team, SpawnCommand, FighterClassName } from "@meka-js/core";
import { MekaClient } from "@meka-js/client";
import requireEnv from "../utils/requireEnv";

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
