require("dotenv").config();
import {
  Team,
  PickUpFoodCommand,
  DropOffFoodCommand,
  AttackCommand
} from "@meka-js/core";
import { MekaClient } from "@meka-js/client";

// Meka config
const gameId = process.env.GAME_ID || "";
const apiUrl = process.env.MEKA_API_URL || "http://localhost:3000";
const webSocketUrl = process.env.MEKA_WEB_SOCKET_URL || "ws://localhost:3000";
const apiKey = process.env.MEKA_API_KEY || "";
const apiSecret = process.env.MEKA_API_SECRET || "";

const collectFood = (meka: MekaClient, team: Team) => {
  team.citizens.forEach(citizen => {
    if (meka.unitIsBusy(citizen)) return;
    if (citizen.food) {
      const command = new DropOffFoodCommand({
        unit: citizen,
        args: { hqId: team.hq.id }
      });
      meka.sendCommand(command);
    } else {
      const food =
        meka.game.foodsList[
          Math.floor(Math.random() * meka.game.foodsList.length)
        ];
      const command = new PickUpFoodCommand({
        unit: citizen,
        args: { foodId: food.id }
      });
      meka.sendCommand(command);
    }
  });
};

const attackEnemyHQ = (meka: MekaClient, team: Team) => {
  const enemyTeam = meka.game.teams.filter(t => t.id !== team.id)[0];
  const enemyHq = enemyTeam.hq;
  team.fighters.forEach(fighter => {
    if (!meka.unitIsBusy(fighter)) {
      const command = new AttackCommand({
        unit: fighter,
        args: { targetId: enemyHq.id }
      });
      meka.sendCommand(command);
    }
  });
};

const doTick = (meka: MekaClient, teamId: string) => {
  const team = meka.game.getTeam(teamId);
  console.log("Start tick", meka.turn);
  collectFood(meka, team);
  attackEnemyHQ(meka, team);
};

const start = (meka: MekaClient, teamId: string) => {
  meka.on("tick", () => doTick(meka, teamId));
};

const doWork = async () => {
  const meka = new MekaClient({
    gameId,
    apiKey,
    apiSecret,
    apiUrl,
    webSocketUrl
  });
  await meka.connect();
  const me = await meka.api.me();
  const teamId = me.uid;
  if (meka.status === "ended") {
    console.log("Game already over");
    return;
  }
  if (meka.status !== "inprogress") {
    meka.on("start", () => start(meka, teamId));
  } else if (meka.status === "inprogress") {
    start(meka, teamId);
  }
};

doWork();
