<img src="https://playmeka.com/meka-logo-black.svg" width="30%" />

Welcome to **MEKA**! This repo will guide you through creating your first automated strategy on MEKA. Let's get started.

## Introduction

This repo provides one example for programmatically interacting with MEKA. We use Typescript here, so please read up on Typescript beforehand if you're not familiar with that language. We will likely have examples in other languages as well in the future.

# Getting Started

## Installation

Get started by cloning this repo to your local machine:

```
git clone https://github.com/playmeka/meka-boilerplate.git
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

This repo includes a number of (simple) example scripts for your reference. Let's start with the `tick.ts` script which just connects to a game and prints out the current turn each tick (every 500ms). Take a look at [examples/tick.ts](examples/tick.ts) for reference.

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

You'll notice that no ticks seem to be coming through. That's likely because the game hasn't actually started! Games won't begin until two users are present and mark themselves both as **ready**. Head back to the web version of MEKA and mark yourself as ready. If no one has shown up to play you, send the link to a friend or create a second account for yourself (with a different Github account).

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

One of the first tasks you'll likely automate is food collection. Food is needed to spawn new units, so it's important you're gathering food quickly and efficiently. The `collectRandomFood` script is not efficient, but it should give you an idea for how to structure your food collection strategy. Run the `collectRandomFood` strategy:

```
ts-node examples/collectRandomFood.ts
```

Note: make sure the game affiliated with the game ID you have stored in `.env` is still open or in-progress.

You have three types of units on your team: citizens, fighters, and HQs. Each team has one HQ and starts with one citizen. HQs can spawn new citizens or fighters by spending food. Citizens can pick-up food and drop it off at the HQ. Note: there are multiple kinds of fighter units, but we'll talk about those at a later point.

You communicate with your units by sending **commands** to them. When you send commands, they are queued by the game engine. Every tick, the engine looks at all the commands in the queue and turns them into **actions** for the units to execute. A command may take many ticks and many actions to succeed, and your units are considered busy (as checked by the `unitIsBusy` util function) if they have a command that they're actively following.

We'll go over all the command and action types later on, but the `collectRandomFood` script uses two commands: `PickUpFoodCommand` and `DropOffFoodCommand`. These are self-explanatory, but you send a `PickUpFoodCommand` to tell one of your citizens to pick-up a particular food (specified by `foodId`), and you send a `DropOffFoodCommand` to tell a citizen to deposit a food that it is carrying at the HQ (specified by `hqId`). Note: a citizen can carry only one food at a time.

### Bonus: efficient food collection

The `collectRandomFood` strategy is clearly sub-optimal, because whenever a citizen is free, it assigns it a random food from anywhere on the board. So even if a citizen has a food next to it, the script may still send it across the board to get another food. So how would you assign citizens to foods more efficiently? How would you figure out which food is closest to each of your citizens—and is that even the best heuristic? `meka-core` includes some path-finding helper functions that may be a good place to start. Check out the [`getPathTo`](https://github.com/playmeka/meka-core/blob/0935fe6fcc20b720740e5fa51c9b75e08eec73f5/src/Citizen.ts#L64) method in the `Citizen` class.

## Run the `attackEnemyHQ` strategy

The `attackEnemyHQ` strategy directs all of your idle fighters to attack the enemy HQ. Run it like this:

```
ts-node examples/attackEnemyHQ.ts
```

The script will print the current HP of the enemy's HQ and tell you when you don't have any fighters or when you send an `AttackCommand`. As you can see in the example script, you can send an `AttackCommand` with `unit` (the fighter you want to direct) and a `targetId` argument (specifying the ID of the unit you want to attack).

When a fighter receives an `AttackCommand`, it will the attack the target if it is in range (by executing an `AttackAction`), and move towards the target otherwise (by executing a `MoveAction`). A fighter's range and speed (measured in positions per tick) clearly affect its attack behavior. Here is a table showing the range and speed of fighters:

| Unit     | Class             | Speed | Range |
| -------- | ----------------- | ----- | ----- |
| Infantry | `InfantryFighter` | 1     | 1     |
| Cavalry  | `CavalryFighter`  | 2     | 1     |
| Ranged   | `RangedFighter`   | 1     | 3     |
| HQ       | `HQ`              | 0     | 3     |

The `HQ` unit is the exception, because while it can attack units, it cannot move. So attack commands that are sent for targets out of range of an HQ will be ignored after three ticks.

The attack damage for each unit also differs. The units are designed to counter each other—similar to rock, paper, scissors. Infantry beat Cavalry, Cavalry beat Ranged, and Ranged beat Infantry. There are certainly exceptions where good micro-strategy will overcome the built-in advantages, but for the most part this triangle proves true.

Here are the units with their hit points (HP), base attack damage, and attack bonuses:

| Unit     | Class             | HP  | Attack | Bonus                      |
| -------- | ----------------- | --- | ------ | -------------------------- |
| Infantry | `InfantryFighter` | 32  | 10     | +5 against Cavalry         |
| Cavalry  | `CavalryFighter`  | 30  | 6      | +6 attack against Ranged   |
| Ranged   | `RangedFighter`   | 24  | 7      | +4 attack against Infantry |
| HQ       | `HQ`              | 500 | 6      | N/A                        |
| Citizen  | `Citizen`         | 10  | 0      | N/A                        |

## Run the `spawnUnits` strategy

The `spawnUnits` strategy is an example of programmatically spawning new units. The script will try to spawn new citizens until you have two citizens, and then try to spawn one of the three fighter units (infantry, ranged, or cavalry).

```
ts-node examples/spawnUnits.ts
```

You can spawn one new citizen or fighter per click, assuming you have enough food collected. The units have different costs, which you can see by checking the `settings` object on your team.

```
const team = new Team(...);
team.settings.cost;
> {
  Citizen: 2,
  InfantryFighter: 4,
  RangedFighter: 4,
  CavalryFighter: 3
}
```

The numbers above correspond to the amount of food you have to spend to spawn each of the units.

## Use `commander.js` to pass arguments through CLI

Instead of updating your `.env` for every game, you can pass in config arguments like the game ID through the command line. The `cli.ts` example script uses [commander.js](https://github.com/tj/commander.js/) to parse CLI arguments. Try it like this:

```
ts-node examples/cli.ts tick <game ID>
```

You can also pass the `--help` argument to see the set of full options. Ultimately, you may structure your code however you like. Our goal here is just to provide helpful examples to get started.

# Reference

The examples given in `meka-boilerplate` cover only some of the functionality provided by the MEKA game engine. For a full list of functionality, read the documentation for `meka-core` and `meka-client`.

#### meka-core

The `meka-core` library encapsulates all of the MEKA game engine logic. Games can be serialized and deserialized, and you'll use `meka-core` to structure all interactions with the game engine. [Read the meka-core docs here](https://github.com/playmeka/meka-core).

#### meka-client

The `meka-client` library includes functionality for interacting with the MEKA game server. The game server uses WebSockets to receive and broadcast messages to and from players' clients. Each instance of `meka-client` is an event emitter, so you can subscribe to particular events. [Read the meka-client docs here](https://github.com/playmeka/meka-client).
