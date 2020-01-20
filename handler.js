import { Position, Action, Game, Fighter } from "@meka-js/core";

function pluck(array, key) {
  return array.map(o => o[key]);
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
        this.game.isValidMove(adj, this.teamId)
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

class TurnStore {
  constructor(gameJson, teamId) {
    this.game = Game.fromJSON(gameJson);
    this.myTeam = this.game.getTeam(teamId);
    this.enemyTeam= this.game.teams.filter(team => team.id != teamId)[0];
    this.enemyHq = pluck(this.enemyTeam.hq.covering, "key")

    this.foodMap = new FoodMap(this.game, teamId);
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
    this.myTeam.fighters.map(fighter => {
      const attacked = this.getNextFighterAttack(fighter);
      if (!attacked) this.getNextFighterMove(fighter);
    });
  }

  getNextFighterAttack(fighter) {
    for (let i = 0; i < fighter.position.adjacents.length; i++) {
      const position = fighter.position.adjacents[i];
      const target = this.game.hqs[position.key]
      if (target && target.team.id != this.myTeam.id) {
        this.actions.push(new Action(fighter, "attack", { position }));
        return true;
      }
    }
    return false;
  }

  getNextFighterMove(fighter) {
    let possiblePositions = []
    this.enemyTeam.hq.covering.forEach(hqPosition => {
      hqPosition.adjacents.forEach(hqAdjacents => {
        possiblePositions.push(hqAdjacents)
      })
    })
    possiblePositions = possiblePositions.filter(possiblePosition => !this.enemyHq.includes(possiblePosition.key))

    possiblePositions.forEach(position => {
      if (this.game.isValidMove(position) && !this.movesMap[position.key]) {
        this.movesMap[position.key] = fighter.id;
        this.actions.push(new Action(fighter, "move", { position: position }));
      }
    })
  }

  getCitizenActions() {
    this.myTeam.citizens.map(citizen => {
      if (citizen.food) {
        this.getNextMoveToHQ(citizen);
      } else {
        this.getNextMoveToFood(citizen);
      }
    });
  }

  getNextMoveToFood(citizen) {
    for (let i = 0; i < citizen.position.adjacents.length; i++) {
      const position = citizen.position.adjacents[i];
      const closestFood = this.foodMap.check(position);
      if (closestFood && !this.foodAssignment[closestFood.food.id] && !this.movesMap[closestFood.food.key]) {
        this.foodAssignment[closestFood.food.id] = citizen.id;
        this.movesMap[closestFood.food.key] = citizen.id;
        this.actions.push(new Action(citizen, "move", { position: closestFood.food.position }));
        return;
      }
    }
  }

  getNextMoveToHQ(citizen) {
    this.myTeam.hq.covering.forEach(position => {
      if (!this.movesMap[position.key]){
        this.movesMap[position.key] = citizen.id;
        this.actions.push(new Action(citizen, "move", { position: position }));
      }
    })
  }

  getSpawns() {
    const citizenCount = this.myTeam.citizens.length;
    if (this.myTeam.foodCount >= this.game.fighterCost) {
      this.actions.push(new Action(this.myTeam.hq, "spawnFighter"));
    } else if (
      this.myTeam.foodCount >= this.game.citizenCost &&
      citizenCount < 1
    ) {
      this.actions.push(new Action(this.myTeam.hq, "spawnCitizen"));
    }
  }
}

export const ahBeingRushed = async event => {
  const store = new TurnStore(event.game, event.teamId);
  store.getActions();
  return store.actions;
};
