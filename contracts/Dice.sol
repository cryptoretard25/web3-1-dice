// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Token.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract Dice {

  struct Game {
    address player1;
    address player2;
    uint256 startGameTime;
    uint256 timeoutGameTime;
    uint256 betAmount;
    uint256 player1Roll;
    uint256 player2Roll;
    bool player1Rolled;
    bool player2Rolled;
    bool gameEnded;
    bool gameStarted;
    address winner;
  }

  Game [] public games;
  ERC20Token public tokenContract;
  uint256 public dealerTax = 0;

  event GameCreated (
    uint256 indexed gameId, 
    address gameCreator, 
    uint256 betAmount, 
    uint256 currTime
    );

  event GameStarted (
    uint256 indexed gameId,
    address player1, 
    address player2, 
    uint256 betAmount,
    uint256 currTime, 
    uint256 timeoutGameTime
    );
  
  event GameRestarted (
    uint256 indexed gameId,
    address player1, 
    address player2, 
    uint256 betAmount,
    uint256 currTime, 
    uint256 timeoutGameTime
    );

  event GameEnded (
    uint256 indexed gameId, 
    address gameWinner, 
    uint256 gamePrize, 
    uint256 currTime,
    uint256 timeoutGameTime
    );
  
  event Rolled (
    uint256 indexed gameId, 
    address player, 
    uint256 roll,
    uint256 currTime
    );

  modifier onlyPlayers(uint256 gameId){
    address player1 = games[gameId].player1;
    address player2 = games[gameId].player2;
    require(msg.sender == player1 || msg.sender == player2, "You are not a part of this game.");
    _;
  }

  modifier gameStarted(uint256 gameId){
    require(games[gameId].gameStarted, "The game has not started yet.");
    _;
  }

  modifier gameNotEnded(uint256 gameId) {
    require(!games[gameId].gameEnded, "The game has already ended.");
    _;
  }

  constructor(address _tokenAddress){
    tokenContract = ERC20Token(_tokenAddress);
  }

  // public methods
  function getGames() public view returns (Game [] memory) {
    return games;
  }

  function getGame(uint256 gameId) public view returns(Game memory){
    require(gameId<games.length, "Invalid game id.");
    return games[gameId];
  }

  function createGame(uint256 _betAmount) public {
    require(tokenContract.balanceOf(msg.sender) >= _betAmount, "Not enough tokens.");
    require(_betAmount > 0, "Bet amount must be greater than 0");

    bool success = tokenContract.transferFrom(msg.sender, address(this), _betAmount);

    if(success){
      Game memory newGame = Game({
      player1: msg.sender,            // 0
      player2: address(0),            // 1         
      startGameTime: 0,    // 2
      timeoutGameTime: 0,              // 3
      betAmount: _betAmount,          // 4
      player1Roll: 0,                 // 5
      player2Roll: 0,                 // 6
      player1Rolled: false,           // 7
      player2Rolled: false,           // 8
      gameEnded: false,               // 9
      gameStarted: false,             // 10
      winner: address(0)              // 11
      });

      games.push(newGame);

      emit GameCreated(games.length - 1, msg.sender, _betAmount, block.timestamp);
    } else {
      revert("Insufficient balance or transfer error.");
    }    
  }

  function joinGame(uint256 gameId) public gameNotEnded(gameId) {
    require(tokenContract.balanceOf(msg.sender) >= games[gameId].betAmount, "Not enough tokens.");
    require(games[gameId].player1 != msg.sender, "You cant play with self.");
    require(games[gameId].player2 == address(0), "Game is full.");

    Game storage currGame = games[gameId];

    bool success = tokenContract.transferFrom(msg.sender, address(this), currGame.betAmount);

    if(success) {
      currGame.player2 = msg.sender;
      currGame.startGameTime = block.timestamp;
      currGame.timeoutGameTime = block.timestamp + 40 seconds;
      currGame.gameStarted = true;

      emit GameStarted (
        gameId,
        currGame.player1, 
        currGame.player2, 
        currGame.betAmount,
        currGame.startGameTime, 
        currGame.timeoutGameTime ); 

    } else {
      revert("Insufficient balance or transfer error.");
    }
  }

  function play(uint256 gameId) public gameStarted(gameId) gameNotEnded(gameId) onlyPlayers(gameId) {
    require(block.timestamp <= games[gameId].timeoutGameTime, "Game time ended.");

    Game storage currGame = games[gameId];

    if (msg.sender == currGame.player1){
      require(!currGame.player1Rolled, "Player 1 already rolled the dice.");
      currGame.player1Roll = randomNumber(100);
      currGame.player1Rolled = true;
      emit Rolled(gameId, msg.sender, currGame.player1Roll, block.timestamp);

    } else if (msg.sender == currGame.player2){
      require(!currGame.player2Rolled, "Player 2 already rolled the dice.");
      currGame.player2Roll = randomNumber(100);
      currGame.player2Rolled = true;
      emit Rolled(gameId, msg.sender, currGame.player2Roll, block.timestamp);
    }

    if (currGame.player1Rolled && currGame.player2Rolled){
      currGame.winner = determineWinner(gameId);
      if(currGame.winner == address(0)){
        currGame.player1Roll = 0;
        currGame.player2Roll = 0;
        currGame.player1Rolled = false;
        currGame.player2Rolled = false;
        currGame.startGameTime = block.timestamp;
        currGame.timeoutGameTime = block.timestamp + 40 seconds;

        emit GameRestarted (gameId, currGame.player1, currGame.player2, currGame.betAmount, currGame.startGameTime, currGame.timeoutGameTime); 
        return;

      } else {
        currGame.gameEnded = true;
        bool success = withdraw(gameId);
        if(success) {
          emit GameEnded (gameId, currGame.winner, currGame.betAmount*2, block.timestamp, currGame.timeoutGameTime);
          return;
        }
      }
    }
  }

  function timeout(uint256 gameId) public gameStarted(gameId) gameNotEnded(gameId) onlyPlayers(gameId) {
    require(block.timestamp > games[gameId].timeoutGameTime, "Game time still going");
    
    Game storage currGame = games[gameId];
    currGame.winner = determineWinner(gameId);
    currGame.gameEnded = true;
    if(currGame.winner == address(0)) {
      bool success = refund(gameId);
      if(success){ 
        emit GameEnded (
          gameId, 
          currGame.winner, 
          currGame.betAmount, 
          block.timestamp, 
          currGame.timeoutGameTime );
        return;
      }
    } else {
      bool success = withdraw(gameId);
      if(success) {
        emit GameEnded (
          gameId, 
          currGame.winner, 
          currGame.betAmount * 2, 
          block.timestamp, 
          currGame.timeoutGameTime );
        return;
      }
    }
  }

  // private methods
  function randomNumber(uint maxNum) private view returns (uint){
    return uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender))) % maxNum + 1;
  }

  function determineWinner(uint256 gameId) private view returns (address) {
    Game memory currGame = games[gameId];
    (uint256 p1Roll, uint256 p2Roll) = (currGame.player1Roll, currGame.player2Roll);
    if (p1Roll > p2Roll) {
      return currGame.player1;
    } else if (p1Roll < p2Roll) {
      return currGame.player2;
    }
    return address(0);
  }

  function withdraw(uint256 gameId) private returns (bool) {
    Game memory currGame = games[gameId];

    require(currGame.gameEnded, "The game has not ended.");

    uint256 prizeAmount = currGame.betAmount * 2;
    bool success = tokenContract.transfer(currGame.winner, prizeAmount);
    return success;
  }

  function refund(uint256 gameId) private returns (bool){
    Game memory currGame = games[gameId];

    require(currGame.gameEnded, "The game has not ended.");

    uint256 refundAmount = currGame.betAmount;
    bool success1 = tokenContract.transfer(currGame.player1, refundAmount);
    bool success2 = tokenContract.transfer(currGame.player2, refundAmount);

    if (!success1 || !success2) revert("Token transfer failed");
    return true;
  }
}