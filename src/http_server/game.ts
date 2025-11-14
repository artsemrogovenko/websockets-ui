import { getNameBySocket, getSocketByName } from './store.ts';
import type {
  AddShips,
  CreateGame,
  GameArea,
  IsShooting,
  PlayerTurn,
  RandomAttack,
  RoomUser,
  StartGame,
} from './types.ts';
import WebSocket from 'ws';
import { generateUuid, getRandomDigit, sendResponse } from './utils.ts';
import { notifyRoom } from './rooms.ts';

const games = new Map<string | number, GameArea>(); // key = gameid value= { indexPlayer, ships }
const whoIsShooting: Record<string | number, IsShooting[]> = {}; // gameId , players

export function createGame(user: RoomUser, gameId: string) {
  const socket = getSocketByName(user.name);

  if (socket) {
    const userUuid = generateUuid();
    const response: CreateGame = {
      type: 'create_game',
      data: {
        idGame: gameId,
        idPlayer: userUuid,
      },
      id: 0,
    };
    sendResponse(response, socket);
  }
}

export function handleShipsPosition(request: AddShips, socket: WebSocket) {
  const { data } = request;
  const { gameId, indexPlayer, ships } = data;
  const _username = getNameBySocket(socket)?.name || '';

  if (!whoIsShooting[gameId]) {
    whoIsShooting[gameId] = [];
  }
  whoIsShooting[gameId.toString()].push({
    indexPlayer: indexPlayer,
    thutly: false,
  });

  const gameRoom = games.get(gameId);
  if (gameRoom) {
    games.set(gameId, [
      ...gameRoom,
      { indexPlayer: indexPlayer, ships: ships, username: _username },
    ]);

    const gameArea = games.get(gameId);
    if (gameArea && gameArea.length > 1) {
      startGame(gameId, gameArea);
    }
  } else {
    games.set(gameId, [
      { indexPlayer: indexPlayer, ships: ships, username: _username },
    ]);
  }
}

function startGame(gameId: string | number, gameArea: GameArea) {
  gameArea.forEach((p, index, array) => {
    const response: StartGame = {
      data: { currentPlayerIndex: p.indexPlayer, ships: p.ships },
      id: 0,
      type: 'start_game',
    };
    const socket = getSocketByName(p.username);
    if (socket) {
      sendResponse(response, socket);
    }
    if (index === array.length - 1) {
      turnPlayer(p.indexPlayer, gameId, gameArea);
    }
  });
}

function turnPlayer(
  indexPlayer: string | number,
  gameId: string | number,
  game: GameArea,
) {
  const players = whoIsShooting[gameId];
  whoIsShooting[gameId] = players.map((player) => {
    player.thutly = player.indexPlayer === indexPlayer;
    return player;
  });

  const response: PlayerTurn = {
    type: 'turn',
    data: { currentPlayer: indexPlayer },
    id: 0,
  };
  const names = game.flatMap((gameArea) => {
    return gameArea.username;
  });
  notifyRoom(names, response);
}

export function doRandomAttack(request: RandomAttack) {
  const { data } = request;
  const attackerId = data.indexPlayer;
  const gameid = data.gameId;

  const enemyId = whoIsShooting[gameid]
    .filter((id) => id.indexPlayer !== attackerId)
    .pop()?.indexPlayer;

  const x = getRandomDigit();
  const y = getRandomDigit();
  if (enemyId) makeAttack(x, y, enemyId, gameid);
}

function makeAttack(
  x: number,
  y: number,
  enemyId: string | number,
  gameid: string | number,
) {
  const area = games.get(gameid);
  if (area) {
    const enemy = area
      .filter((value) => {
        return value.indexPlayer === enemyId;
      })
      .pop();
    if (enemy) {
      // const socket = getSocketByName(enemy.username);
    }
  }
}
