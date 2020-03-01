<img src="https://playmeka.com/meka-logo-black.svg" width="30%" />



Welcome to **MEKA**! This repo will guide you through creating your first automated strategy on MEKA. Let's get started.

## Introduction
This repo provides one example for programmatically interacting with MEKA. We use Typescript here, so please read up on Typescript beforehand if you're not familiar with that language. We will likely have examples in other languages as well in the future.

# Getting Started

## Installation
Get started by cloning this repo to your local machine:
```
git clone git@github.com:playmeka/meka-boilerplate.git
```

Install node modules in the cloned directory:
```
cd meka-boilerplate
yarn install
```

## Create a MEKA account
If you don't already have a MEKA account, go create one now. MEKA uses Github for authentication, so go to this link to sign up: https://playmeka.com.

## Get your MEKA API credentials
Once you have a MEKA account, click on your username in the top right corner or go to [settings](https://playmeka.com/settings). Scroll to the bottom of the page to get your `API KEY` and `API SECRET`. These will be used to authenticate you when interacting with the MEKA game engine.

## Set up your local .env
Duplicate `.env.example` in the `meka-boilerplate` directory and change its name to `.env`. Copy and paste your API key and secret into `.env` as the values for `MEKA_API_KEY` and `MEKA_API_SECRET` respectively. These values will be automatically be imported as environment variables when you run your code.

## Start a game
`meka-boilerplate` needs a game to connet to. So go to your web version of MEKA and create a new game in the lobby by clicking the "Create a new game" button. Once you're redirected to the new game, copy the Game ID either from the URL (`https://playmeka.com/game/<Game ID>`) or the Game ID field on the page. Add the game ID to your `.env` file as `GAME_ID`.

## Run the `tick` strategy
This repo includes a number of (simple) example scripts for your reference. Let's start with the `tick.ts` script which just connects to a game and prints out the current turn each tick (every 500ms). Take a look at `examples/tick.ts` for reference.

Run the strategy in the `meka-boilerplate` directory:
```
ts-node examples/tick.ts
```
Notice how `tick.ts` will pull the game ID from `.env`, so make sure you updated that file with the current game ID. You'll see later how to pass in the game ID from the command line.

The process should stay open, and you should see output with your own user credentials like this:
```
Hi! {
  username: '<your username>',
  avatarUrl: '<image URL>',
  apiKey: '<your API key>',
  email: '<your email>',
  uid: '<your user ID>'
}
```
You'll notice that no ticks seem to be coming through. That's likely because the game hasn't actually started! Games won't begin until two users are present and mark themselves both as **ready**. Head back to the web version of MEKA and mark yourself as ready. If no one has shown up to play you, send the link to a friend or create a second account for yourself.

Keep the `tick.ts` process open this whole time, and when the game finally starts, you should see output like below in your console:
```
Tick 1
Tick 2
Tick 3
...
```
If you're seeing the same output, that's great! You've just successfully connected your machine to MEKA, and it's streaming data from the game for you to react to. You can now stop the `tick.ts` process if it's still running—we're going to try something a bit more complicated.

### Bonus: staying connected to a game
You may notice that from the web version of MEKA that if you drop from or leave a live game you're given 30 seconds to reconnect before automatically forfeiting. When you connect to a game through the command line, you can suddenly leave a game without risk of forfeiting. That's because you need at least one connection to the game at all times, and the web client and your command line both count as individual connections. So if you close your browser, you're still connected through the command line. Likewise, as long as you keep your browser open to the game, you can feel comfortable starting and stopping command line processes mid-game. 

## Run the `collectRandomFood` strategy
Now let's start telling your units what to do through the command line. MEKA is all about human/computer collaboration. Initially, you'll likely play most of your games manually through the browser. But over time, you should be automating repeat tasks or strategies with code. Use your brain to develop strategy and be creative, and let your computer do everything else!

One of the first tasks you'll likely automate is food collection. Food is needed to spawn new units, so it's important you're gathering food quickly and efficiently. The `collectRandomFood` script is not efficient, but it should give you an idea for how to structure your food collection strategy.

You have three types of units on your team: citizens, fighters, and HQs. Each team has one HQ and starts with one citizen. HQs can spawn new citizens or fighters by spending food. Citizens can pick-up food and drop it off at the HQ. Note: there are multiple kinds of fighter units, but we'll talk about those at a later point.

You communicate with your units by sending **commands** to them. When you send commands, they are queued by the game engine. Every tick, the engine looks at all the commands in the queue and turns them into **actions** for the units to execute. A command may take many ticks and many actions to succeed, and your units are considered busy (as checked by the `unitIsBusy` util function) if they have a command that they're actively following.

We'll go over all the command and action types later on, but the `collectRandomFood` script uses two commands: `PickUpFoodCommand` and `DropOffFoodCommand`. These are self-explanatory, but you send a `PickUpFoodCommand` to tell one of your citizens to pick-up a particular food (specified by `foodId`), and you send a `DropOffFoodCommand` to tell a citizen to deposit a food that it is carrying at the HQ (specified by `hqId`). Note: a citizen can carry only one food at a time.

### Bonus: efficient food collection
The `collectRandomFood` strategy is clearly sub-optimal, because whenever a citizen is free, it assigns it a random food from anywhere on the board. So even if a citizen has a food next to it, the script may still send it across the board to get another food. So how would you assign citizens to foods more efficiently? How would you figure out which food is closest to each of your citizens—and is that even the best heuristic? `meka-core` includes some path-finding helper functions that may be a good place to start. Check out the `getPathTo` method in the `Citizen` class.

# Reference

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
