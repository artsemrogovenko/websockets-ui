import { getNameBySocket, getSocketByName } from './store.ts';
import type {
  AddShips,
  CreateGame,
  GameArea,
  IsShooting,
  PlayerTurn,
  RandomAttack,
  RoomUser,
  UserShips,
  StartGame,
  ShipPosition,
  Attack,
  AttackFeedback,
  Position,
  FeedbackStaus,
  FinishGame,
} from './types.ts';
import WebSocket from 'ws';
import {
  generateUuid,
  getRandomDigit,
  makeCoordinates,
  sendResponse,
} from './utils.ts';
import { notifyRoom } from './rooms.ts';
import { update_winners } from './winners.ts';

const games = new Map<string | number, GameArea>(); // key = gameid value= { indexPlayer, ships }
const whoIsShooting: Record<string | number, IsShooting[]> = {}; // gameId , players
const shipsPositions = new Map<string | number, UserShips[]>(); // gameid , ships

const shipsAmount: Record<string, number> = {}; //userId бcount of ships not destroyed

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

  shipsPositions.set(gameId, [
    ...(shipsPositions.get(gameId) || []),
    makeCoordinates(request),
  ]);
  shipsAmount[indexPlayer] = ships.length;

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
      turnPlayer(p.indexPlayer, gameId);
    }
  });
}

function getGameAreaOnIndex(indexPlayer: string | number) {
  return [...games.values()]
    .filter((gameArea) => {
      return gameArea.some((user) => user.indexPlayer === indexPlayer);
    })
    .pop();
}

function turnPlayer(indexPlayer: string | number, gameId: string | number) {
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
  const game = getGameAreaOnIndex(indexPlayer);
  const names = game?.flatMap((gameArea) => gameArea.username);
  if (names) notifyRoom(names, response);
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
  if (enemyId) makeAttack(x, y, enemyId, attackerId, gameid);
}

export function handleAttack(request: Attack) {
  const { data } = request;
  const attackerId = data.indexPlayer;
  const gameid = data.gameId;

  const enemyId = whoIsShooting[gameid]
    .filter((id) => id.indexPlayer !== attackerId)
    .pop()?.indexPlayer;

  const x = data.x;
  const y = data.y;
  if (enemyId) makeAttack(x, y, enemyId, attackerId, gameid);
}

function makeAttack(
  x: number,
  y: number,
  enemyId: string | number,
  attackerId: string | number,
  gameid: string | number,
) {
  const isShooting = whoIsShooting[gameid].filter((value) => {
    return value.indexPlayer === attackerId && value.thutly;
  });
  if (!isShooting.length) {
    return;
  }

  const area = games.get(gameid);
  if (area) {
    const enemy = area
      .filter((value) => {
        return value.indexPlayer === enemyId;
      })
      .pop();
    if (enemy) {
      const roomShips = shipsPositions.get(gameid);
      const positions = roomShips
        ?.filter((value) => value.userId === enemyId)
        .pop()?.positions;

      if (positions) {
        const target = { x, y };
        const { found, destroyed } = isHit(
          JSON.stringify(target),
          positions,
          updateShips(gameid, enemyId),
        );
        if (found) {
          if (destroyed?.isKilled) {
            // destroyed.coordinates.forEach((c) => {
            //   feedback(attackerId, JSON.parse(c.coordinate), 'killed');
            // });
            feedback(attackerId, target, 'killed');
            shipsAmount[enemyId] = shipsAmount[enemyId] - 1;
            if (shipsAmount[enemyId] === 0) {
              finishGame(attackerId);
              return
            }
          } else {
            feedback(attackerId, target, 'shot');
          }
          turnPlayer(attackerId, gameid);
        } else {
          feedback(attackerId, target, 'miss');
          turnPlayer(enemyId, gameid);
        }
      }
    }
  }
}

function updateShips(gameId: string | number, userId: string | number) {
  return (ships: ShipPosition[]) => {
    const users = shipsPositions.get(gameId);
    if (users) {
      shipsPositions.set(
        gameId,
        users?.map((user) => {
          if (user.userId === userId) {
            user.positions = ships;
          }
          return user;
        }),
      );
    }
  };
}

type CheckResult = {
  found: boolean;
  destroyed: ShipPosition | null;
};

function isHit(
  point: string,
  positions: ShipPosition[],
  updater: ReturnType<typeof updateShips>,
) {
  let destroyedShip: ShipPosition | null = null;
  const result: CheckResult = { found: false, destroyed: null };
  const updated: ShipPosition[] = [...positions].map((value) => {
    value.coordinates = value.coordinates.map((c) => {
      if (c.coordinate.includes(point)) {
        result.found = true;
        c.breaked = true;
        destroyedShip = value;
      }
      return c;
    });

    if (value.coordinates.every((c) => c.breaked)) {
      value.isKilled = true;
    }
    return value;
  });
  result.destroyed = destroyedShip
  updater(updated);

  return result;
}

function feedback(
  currentPlayer: string | number,
  position: Position,
  status: FeedbackStaus,
) {
  const response: AttackFeedback = {
    type: 'attack',
    data: { currentPlayer: currentPlayer, position: position, status: status },
    id: 0,
  };
  const names = getGameAreaOnIndex(currentPlayer)?.flatMap(
    (user) => user.username,
  );
  if (names) notifyRoom(names, response);
}

function finishGame(winnerId: string | number) {
  const response: FinishGame = {
    type: 'finish',
    data: { winPlayer: winnerId },
    id: 0,
  };

  const game = getGameAreaOnIndex(winnerId);
  const winnerName = game
    ?.filter((value) => {
      value.indexPlayer === winnerId;
    })
    .pop()?.username;

  if (winnerName) update_winners(winnerName);
  const names = getGameAreaOnIndex(winnerId)?.flatMap((user) => user.username);
  if (names){ notifyRoom(names, response);}
}
