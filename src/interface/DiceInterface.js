const ethers = require("ethers");
const { provider, wallet } = require("./connect");
const diceBuild = require("../../build/contracts/Dice.json");

const { approve, decimals, balanceOf, transfer } = require("./TokenInterface");
const { convertTimestampToHuman, findEventByTxHash } = require("./sideMethods");

const diceAbi = diceBuild.abi;
const diceAddress = Object.values(diceBuild.networks).pop().address;
const diceContract = new ethers.Contract(diceAddress, diceAbi, provider);

async function getTokenContract() {
  try {
    return await diceContract.tokenContract();
  } catch (error) {
    console.error(error);
  }
}

async function getGames() {
  try {
    return await diceContract.getGames();
  } catch (error) {
    console.error(error);
  }
}

async function getGame(_id) {
  try {
    return await diceContract.getGame(_id);
  } catch (error) {
    console.error(error);
  }
}

async function createGame(_bet) {
  const signer = await wallet;
  const signedContract = diceContract.connect(signer);

  try {
    const bet = ethers.parseUnits(_bet.toString(), await decimals());

    const tx = await signedContract.createGame(bet);
    const res = await tx.wait();
    const txhash = res.hash;

    const filters = signedContract.filters.GameCreated();
    const events = await signedContract.queryFilter(filters, -20);
    const event = findEventByTxHash(events, txhash);

    const [id, creator, betAmount, timestamp] = event.args;

    return {
      txHash: txhash,
      gameId: Number(id),
      gameCreator: creator,
      betAmount: Number(ethers.formatUnits(betAmount, 9)),
      creationTime: Number(timestamp),
    };
  } catch (error) {
    throw new Error(error);
  }
}

async function joinGame(_id) {
  const signedContract = diceContract.connect(await wallet);
  try {
    const tx = await signedContract.joinGame(_id);
    const res = await tx.wait();
    const txhash = res.hash;

    const filters = signedContract.filters.GameStarted();
    const events = await signedContract.queryFilter(filters, -20);
    const event = findEventByTxHash(events, txhash);

    const [id, player1, player2, betAmount, timestamp, timeout] = event.args;

    return {
      txHash: txhash,
      gameId: Number(id),
      player1: player1,
      player2: player2,
      betAmount: Number(ethers.formatUnits(betAmount, 9)),
      gameStartTime: Number(timestamp),
      gameTimeoutAt: Number(timeout),
    };
  } catch (error) {
    throw new Error(error);
  }
}

async function playGame(_id) {
  const signedContract = diceContract.connect(await wallet);
  try {
    const tx = await signedContract.play(_id);
    const res = await tx.wait();
    const txhash = res.hash;

    const filterRolled = signedContract.filters.Rolled();
    const filterGameEnded = signedContract.filters.GameEnded();
    const filterGameRestarted = signedContract.filters.GameRestarted();

    const eventsRolled = await signedContract.queryFilter(filterRolled, -2);
    const eventsGameEnded = await signedContract.queryFilter(
      filterGameEnded,
      -2
    );
    const eventsGameRestarted = await signedContract.queryFilter(
      filterGameRestarted,
      -2
    );

    const eventRolled = findEventByTxHash(eventsRolled, txhash);
    const eventGameEnded = findEventByTxHash(eventsGameEnded, txhash);
    const eventGameRestarted = findEventByTxHash(eventsGameRestarted, txhash);

    const [id, player, roll, timestamp] = eventRolled.args;

    let result = {
      txhash,
      gameId: Number(id),
      timestamp: Number(timestamp),
      playerRolling: player,
      playerRolled: Number(roll),
    };

    let state;

    if (eventGameRestarted) {
      const [, player1, player2, betAmount, , newTimeout] =
        eventGameRestarted.args;

      state = {
        gameState: "restarted",
        player1,
        player2,
        betAmount: Number(ethers.formatUnits(betAmount, 9)),
        newTimeout: Number(newTimeout),
      };
    } else if (eventGameEnded) {
      const [, winner, prize, , gameTimeout] = eventGameEnded.args;

      state = {
        gameState: "ended",
        hasWinner: true,
        winner,
        prize: Number(ethers.formatUnits(prize, 9)),
        gameTimeout: Number(gameTimeout),
      };
    } else {
      state = {
        gameState: "ongoing",
      };
    }

    result.state = state;
    return result;
  } catch (error) {
    console.error(error);
  }
}

async function timeoutGame(_id) {
  const signedContract = diceContract.connect(await wallet);
  try {
    const tx = await signedContract.timeout(_id);
    const res = await tx.wait();
    const txhash = res.hash;

    const filterGameEnded = signedContract.filters.GameEnded();
    const eventsGameEnded = await signedContract.queryFilter( filterGameEnded, -2 );
    const eventGameEnded = findEventByTxHash(eventsGameEnded, txhash);

    const [gameId, winner, prize, currTime, gameTimeout] = eventGameEnded.args;

    let result = {
      txhash,
      gameId: Number(gameId),
      timestamp: Number(currTime),
      state: {
        gameState: "ended",
        hasWinner: true,
        winner,
        prize: Number(ethers.formatUnits(prize, 9)),
        gameTimeout: Number(gameTimeout),
      },
    };

    if (winner === "0x0000000000000000000000000000000000000000") {
      result.state = {
        gameState: "ended",
        hasWinner: false,
        winner,
        prize: Number(ethers.formatUnits(prize, 9)),
        gameTimeout: Number(gameTimeout),
      };
    }

    return result;

  } catch (error) {
    throw new Error(error);
  }
}

(async () => {
  const balance0 = await balanceOf(
    "0xa9e6322b4862447a85eecEb82B6Ca035ae2D4E97"
  );
  const balance1 = await balanceOf(
    "0x0B42C973d645DCe9a74899eF372eFC47dA8d8FCD"
  );
  console.log("address 0: ", balance0);
  console.log("address 1: ", balance1);

  await approve(diceAddress).then((r) => console.log(r));

  await createGame(50000000).then(r=>console.log(r));

  // await joinGame(1).then(r=>console.log(r));

  // await playGame(1).then((r) => console.log(r));

  // await timeoutGame(1).then(r=>console.log(r));

  // await balanceOf(diceAddress).then((r) => console.log(r));

  // await getGame(0).then(r=> console.log(r))
})();
