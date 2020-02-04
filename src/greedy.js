import MekaClient from "@meka-js/client";
import { Command } from "@meka-js/core";

// Fill in details
const gameUid = "test";
const websocketUrl = "ws://localhost:3000";
const teamUid = "home";

const doTick = game => {
  const team = game.getTeam(teamUid);
  console.log(
    "TICK",
    game.turn,
    "citizen count: ",
    team.citizens.length,
    "food count: ",
    team.foodCount
  );
  const commands = [];
  // Handle citizens
  for (let i = 0; i < team.citizens.length; i++) {
    const citizen = team.citizens[i];
    if (citizen.food) {
      const path = citizen.getPathTo(team.hq.position);
      if (path && path.length >= 2) {
        commands.push(new Command(citizen, "move", { position: path[1] }));
      }
    } else {
      const food = game.foodsList.filter(food => !food.eatenBy)[i];
      const path = citizen.getPathTo(food.position);
      if (path && path.length >= 2) {
        commands.push(new Command(citizen, "move", { position: path[1] }));
      }
    }
  }
  if (team.foodCount >= game.citizenCost) {
    commands.push(new Command(team.hq, "spawnCitizen"));
    console.log("SEND SPAWN");
  }
  console.log("Sending commands", commands);
  meka.sendCommands(commands);
};

const meka = new MekaClient({
  gameUid,
  websocketUrl,
  onTick: doTick
});

console.log("Started Meka client", meka);
