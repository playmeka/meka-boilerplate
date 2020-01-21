// Simple greedy strategy by @pfletcherhill
import { Position, Action, Game } from "@meka-js/core";
import shuffle from "lodash/shuffle";

class HQMap {
  constructor(game, hq) {
    this.game = game;
    this.distanceToHQ = {}; // Map of positions to {distance: Number, position: Position}
    this.queue = [];
    hq.covering.forEach(position => {
      this.distanceToHQ[position.key] = { distance: 0, hqPosition: position };
      this.queue.push(position);
    });
    this.doAllWork();
  }

  check(position) {
    return this.distanceToHQ[position.key];
  }

  doAllWork() {
    while (this.queue.length > 0) {
      this.doWork();
    }
  }

  // One loop through queue
  doWork() {
    const activeQueue = this.queue;
    this.queue = [];
    activeQueue.forEach(position => {
      // Get distance for position
      const { distance, hqPosition } = this.distanceToHQ[position.key];
      // Get positions that are adjacent, in-bounds, and don't have a wall
      const steps = position.adjacents.filter(adj =>
        this.game.isValidPosition(adj, this.teamId)
      );
      // Check each step, record distance and add to queue if valid
      steps.forEach(step => {
        const currentDistance = this.distanceToHQ[step.key];
        if (!currentDistance || distance < currentDistance.distance) {
          this.distanceToHQ[step.key] = {
            distance: distance + 1,
            hqPosition
          };
          this.queue.push(step);
        }
      });
    });
  }
}

class FoodMap {
  constructor(game, teamId) {
    this.game = game;
    this.teamId = teamId;
    this.distanceToFood = {}; // Map of positions to {distance: Number, food: ID}
    this.queue = [];
    game.foodsList
      .filter(food => !food.eatenBy)
      .forEach(food => {
        this.distanceToFood[food.position.key] = {
          distance: 0,
          foodId: food.id
        };
        this.queue.push(food.position);
      });
    this.doAllWork();
  }

  check(position) {
    const value = this.distanceToFood[position.key];
    if (!value) return null;
    return { distance: value.distance, food: this.game.lookup[value.foodId] };
  }

  doAllWork() {
    while (this.queue.length > 0) {
      this.doWork();
    }
  }

  // One loop through queue
  doWork() {
    const activeQueue = this.queue;
    this.queue = [];
    activeQueue.forEach(position => {
      // Get distance for position
      const { distance, foodId } = this.distanceToFood[position.key];
      // Get positions that are adjacent, in-bounds, and don't have a wall
      const steps = position.adjacents.filter(adj =>
        this.game.isValidPosition(adj, this.teamId)
      );
      // Check each step, record distance and add to queue if valid
      steps.forEach(step => {
        const currentDistance = this.distanceToFood[step.key];
        if (!currentDistance || distance < currentDistance.distance) {
          this.distanceToFood[step.key] = {
            distance: distance + 1,
            foodId
          };
          this.queue.push(step);
        }
      });
    });
  }
}

class EnemyMap {
  constructor(game, teamId) {
    this.game = game;
    this.teamId = teamId;
    this.distanceToEnemy = {}; // Map of positions to {distance: Number, enemy: ID}
    this.queue = [];
    const enemyTeam = game.teams.filter(team => team.id != teamId)[0];
    const enemyAgents = [
      ...enemyTeam.citizens,
      ...enemyTeam.fighters,
      enemyTeam.hq
    ];
    enemyAgents.forEach(agent => {
      agent.covering.forEach(position => {
        this.distanceToEnemy[position.key] = {
          distance: 0,
          enemyId: agent.id
        };
        this.queue.push(position);
      });
    });
    this.doAllWork();
  }

  check(position) {
    const value = this.distanceToEnemy[position.key];
    if (!value) return null;
    return { distance: value.distance, enemy: this.game.lookup[value.enemyId] };
  }

  doAllWork() {
    while (this.queue.length > 0) {
      this.doWork();
    }
  }

  // One loop through queue
  doWork() {
    const activeQueue = this.queue;
    this.queue = [];
    activeQueue.forEach(position => {
      // Get distance for position
      const { distance, enemyId } = this.distanceToEnemy[position.key];
      // Get positions that are adjacent, in-bounds, and don't have a wall
      const steps = position.adjacents.filter(adj =>
        this.game.isValidPosition(adj, this.teamId)
      );
      // Check each step, record distance and add to queue if valid
      steps.forEach(step => {
        const currentDistance = this.distanceToEnemy[step.key];
        if (!currentDistance || distance < currentDistance.distance) {
          this.distanceToEnemy[step.key] = {
            distance: distance + 1,
            enemyId
          };
          this.queue.push(step);
        }
      });
    });
  }
}

class TurnStore {
  constructor(gameJson, teamId) {
    this.game = Game.fromJSON(gameJson);
    this.team = this.game.getTeam(teamId);
    this.foodMap = new FoodMap(this.game, teamId);
    this.hqMap = new HQMap(this.game, this.team.hq);
    this.enemyMap = new EnemyMap(this.game, teamId);
    this.movesMap = {}; // Positions to agent IDs to avoid collisions
    this.foodAssignment = {}; // Food IDs to citizen IDs to avoid collisions
    this.actions = [];
  }

  getActions() {
    this.getFighterActions();
    this.getCitizenActions();
    this.getSpawns();
  }

  getFighterActions() {
    this.team.fighters.map(fighter => {
      const attacked = this.getNextFighterAttack(fighter);
      if (!attacked) this.getNextFighterMove(fighter);
    });
  }

  getNextFighterAttack(fighter) {
    const attackOptions = [];
    fighter.position.adjacents.forEach(position => {
      const target =
        this.game.fighters[position.key] ||
        this.game.citizens[position.key] ||
        this.game.hqs[position.key];
      if (target && target.team.id != this.team.id) {
        attackOptions.push({ position, target });
      }
    });
    if (!attackOptions.length) return false;
    const { position, target } = shuffle(attackOptions)[0];
    this.actions.push(new Action(fighter, "attack", { position }));
    return true;
  }

  getNextFighterMove(fighter) {
    let bestMove;
    let bestMoveDistance;
    fighter.position.adjacents.forEach(position => {
      const fromEnemy = this.enemyMap.check(position);
      if (
        fromEnemy &&
        !this.movesMap[position.key] &&
        (!bestMove || fromEnemy.distance < bestMoveDistance)
      ) {
        bestMove = position;
        bestMoveDistance = fromEnemy.distance;
      }
    });
    if (!bestMove) return false;
    this.movesMap[bestMove.key] = fighter.id;
    this.actions.push(new Action(fighter, "move", { position: bestMove }));
  }

  getCitizenActions() {
    this.team.citizens.map(citizen => {
      if (citizen.food) {
        this.getNextMoveToHQ(citizen);
      } else {
        this.getNextMoveToFood(citizen);
      }
    });
  }

  getNextMoveToFood(citizen) {
    let bestMove;
    let bestMoveDistance;
    let bestMoveFood;
    citizen.position.adjacents.forEach(position => {
      const fromFood = this.foodMap.check(position);
      if (
        fromFood &&
        !this.foodAssignment[fromFood.food.id] &&
        !this.movesMap[position.key] &&
        (!bestMove || fromFood.distance < bestMoveDistance)
      ) {
        bestMove = position;
        bestMoveDistance = fromFood.distance;
        bestMoveFood = fromFood.food;
      }
    });
    if (!bestMove) return false;
    this.movesMap[bestMove.key] = citizen.id;
    this.foodAssignment[bestMoveFood.id] = citizen.id;
    this.actions.push(new Action(citizen, "move", { position: bestMove }));
  }

  getNextMoveToHQ(citizen) {
    let bestMove;
    let bestMoveDistance;
    citizen.position.adjacents.forEach(position => {
      const fromHQ = this.hqMap.check(position);
      if (
        fromHQ &&
        !this.movesMap[position.key] &&
        (!bestMove || fromHQ.distance < bestMoveDistance)
      ) {
        bestMove = position;
        bestMoveDistance = fromHQ.distance;
      }
    });
    if (!bestMove) return false;
    this.movesMap[bestMove.key] = citizen.id;
    this.actions.push(new Action(citizen, "move", { position: bestMove }));
  }

  getSpawns() {
    const citizenCount = this.team.citizens.length;
    if (this.team.foodCount >= this.game.fighterCost && citizenCount >= 2) {
      this.actions.push(new Action(this.team.hq, "spawnFighter"));
    } else if (
      this.team.foodCount >= this.game.citizenCost &&
      citizenCount < 2
    ) {
      this.actions.push(new Action(this.team.hq, "spawnCitizen"));
    }
  }
}

export default function runGreedyStrategy(event) {
  const store = new TurnStore(event.game, event.teamId);
  store.getActions();
  return store.actions;
};
