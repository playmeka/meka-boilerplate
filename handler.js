import { Position, Action, Game } from "@meka-js/core";
import runGreedyStrategy from "./strategies/greedyStrategy"
import runRandomStrategy from "./strategies/randomStrategy"

export const random = async event => {
  return runRandomStrategy(event);
};

export const greedy = async event => {
  return runGreedyStrategy(event);
};
