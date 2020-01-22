import { Position, Action, Game } from "@meka-js/core";

export default async function runRandomStrategy(event) {
  const game = Game.fromJSON(event.game);
  const actions = [];
  const team = game.getTeam(event.teamId);
  team.citizens.forEach(citizen => {
    actions.push(getActionForCitizen(citizen));
  });
  return actions;
};

const getActionForCitizen = citizen => {
  const options = [
    new Position(citizen.position.x + 1, citizen.position.y),
    new Position(citizen.position.x - 1, citizen.position.y),
    new Position(citizen.position.x, citizen.position.y + 1),
    new Position(citizen.position.x, citizen.position.y - 1)
  ];
  const randomIndex = Math.floor(Math.random() * options.length);
  return new Action(citizen, "move", { position: options[randomIndex] })
}
