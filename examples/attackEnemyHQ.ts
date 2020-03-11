import { Fighter, HQ, AttackCommand } from "@meka-js/core";
import { MekaClient } from "@meka-js/client";
import requireEnv from "../utils/requireEnv";

const attackEnemyHQ = (meka: MekaClient, fighter: Fighter, hq: HQ) => {
  if (meka.unitIsBusy(fighter)) return;
  const command = new AttackCommand({
    unit: fighter,
    args: { targetId: hq.id }
  });
  meka.sendCommand(command);
  console.log("Sent command", command);
};

// Print out the turn every tick
const doTick = (meka: MekaClient, teamId: string) => {
  const team = meka.game.getTeam(teamId);
  const enemyTeam = meka.game.teams.find(t => t.id !== teamId);
  const enemyHq = enemyTeam.hq;
  console.log("Enemy HQ health: ", enemyHq.hp);
  if (!team.fighters.length) {
    console.log("You don't have any fighters to command!");
    return;
  }
  team.fighters.forEach(fighter => attackEnemyHQ(meka, fighter, enemyHq));
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
