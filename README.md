# Meka Boilerplate
Starter repo to develop your own strategies for Meka

## Installation
Clone the Meka boilerplate repo:
```
git clone git@github.com:hillstreetlabs/meka-boilerplate.git
```

Install node modules in the cloned directory:
```
cd meka-boilerplate
yarn install
```

Make sure the installation process is successful, by running `meka --version`. If the `meka` command is not found, try running `yarn global add "@meka-js/cli"`

## Getting started

Behind the scenes, Meka Boilerplate uses [serverless-offline](https://github.com/dherault/serverless-offline) to run a stubbed version of AWS Lambda in your local dev environment. To start `serverless` locally, run the following command:

```
yarn dev
```

A stubbed version of AWS Lambda will run on port 3002, though you can change the port in `serverless.yml`.

In a separate console window, start the Meka dev environment (running on port 4000 by default):
```
meka dev --port 4000 --lambdaPort 3002
```

Meka dev environment gives you random games, allows you to step through them, and visualize how your strategy is performing. To see a sample game, go to [http://localhost:4000](http://localhost:4000) and click the "Tutorial" button.

## Writing a strategy

This section introduces different aspects of writing a new strategy for Meka. Please see the `/strategies` folder for sample strategies. At its core, writing your strategy is simple: You receive the game state as the `event` input, and return an array of `Actions` (to be discussed in more detail down below).

TODO: Brief introduction to serverless handlers

### Game state

The tutorial game is initiated with a 12x12 board with two opposing teams. ~20% of the board is walls (agents cannot move through these) and another ~20% is food (sustenance for growing your population). Each team starts with a single citizen, and the population cap is 10. 

Spawning new citizens cost 2 food, spawning new fighters cost 4 food. Citizens can collect food, and fighters can attack the enemy or defend your base. Your starting HQ has an HP of 100. When a team loses its HQ (its `HP <= 0`), they lose the game.

### Strategy input

Your strategy implemented in `handler.js` will receive an event input. This is an object with two important fields: `game` and `teamId`. `teamId` is the string identifier for your team. `game` is a JSON serialized game state that has information on teams, the placement of walls, food and agents (HQs, citizens, fighters).

`@meka-js/core` (TypeScript/Javascript library that implements the core game engine) exports some utility functions to parse the `game` JSON:

```
import { Game } from "@meka-js/core";
const game = Game.fromJSON(event.game);
```

Parsed `game` object has the following fields:

```
const myTeam = game.getTeam(event.teamId);
const { hq, citizens, fighters } = myTeam;
# citizens is an array of Citizen objects
# fighters is an array of Fighter objects
```

`HQ` is the homebase for your team. It's a 2x2 area marked in the map. `HQ` spawns `Citizens` and `Fighters`
`Citizen` is the agent that collects food
`Fighter` is the agent that can deal damage to enemy citizens, fighters or HQs

### Game engine basics

The game engine has the following exports available for use in your strategy: 
```
import { Game, Action, Team, HQ, ObjectWithPosition, Position, Citizen, Fighter, Food, Wall } from "@meka-js/core";
```

`HQ`, `Citizen`, `Fighter`, `Food` and `Wall` classes extend a shared `ObjectWithPosition` class. This enables them to have a `position` subfield (which specifies their `width`, `height`, and `x`/`y` coordinates). For a given `position` you can get the adjacent coordinates by `position.adjacents` which returns an array of `Position` objects.

### Structuring actions

Your strategy (implemented in `handler.js`) should return an array of `Action` objects. 

Each turn an agent (HQ, each fighter, each citizen) may execute one action. These are:
- HQs can spawn citizens of fighters
- Citizens can move to another position on the board
- Fighters can move to another position on the board or attack an enemy agent (HQ, citizen or fighter)

These actions are represented by the following action types: `spawnCitizen`, `spawnFighter`, `move`, `attack`.

The `Action` class takes 3 arguments: 
- An `agent` that's of type `HQ`, `Citizen` or `Fighter`
- An `actionType` that's one of `spawnCitizen`, `spawnFighter`, `move`, `attack`
- An optional `args` field that takes a `Position` object for `move` and `attack` actions.

Example actions:

```
import { Game, Action, Position } from "@meka-js/core";
const game = Game.fromJSON(event.game);
const myTeam = game.getTeam(event.teamId);
const { hq, citizens, fighters } = myTeam;
let actions = [];

# Spawn a citizen at a random position (this will fail if myTeam.foodCount < 2)
actions.push(new Action(hq, "spawnCitizen")); 

# Spawn a fighter at a random position (this will fail if myTeam.foodCount < 4)
actions.push(new Action(hq, "spawnFighter"));

# Get first citizen
const firstCitizen = citizens[0];
const movePosition = new Position(firstCitizen.x + 1, firstCitizen.y + 1);
# Moves the first citizen one square to the right and down
actions.push(new Action(firstCitizen, "move", { position: movePosition }));

const firstFighther = fighters[0];
# Assuming there's an enemy agent one square to the right and down
const attackPosition = new Position(firstFighther.x + 1, firstFighther.y + 1);
actions.push(new Action(firstFighther, "attack", { position: attackPosition }));
```
