import { getNameBySocket, getSocketByName } from './store.ts';
import type {
  AddShips,
  CreateGame,
  GameArea,
  RoomUser,
  StartGame,
} from './types.ts';
import WebSocket from 'ws';
import { generateUuid, sendResponse } from './utils.ts';

const games = new Map<string | number, GameArea>(); // key = gameid value= { indexPlayer, ships }

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

  const gameRoom = games.get(gameId);
  if (gameRoom) {
    games.set(gameId, [
      ...gameRoom,
      { indexPlayer: indexPlayer, ships: ships, username: _username },
    ]);

    const gameArea = games.get(gameId);
    if (gameArea && gameArea.length > 1) {
      startGame(gameArea);
    }
  } else {
    games.set(gameId, [
      { indexPlayer: indexPlayer, ships: ships, username: _username },
    ]);
  }
}

function startGame(players: GameArea) {
  players.forEach((p) => {
    const response: StartGame = {
      data: { currentPlayerIndex: p.indexPlayer, ships: p.ships },
      id: 0,
      type: 'start_game',
    };
    const socket = getSocketByName(p.username);
    if (socket) {
      sendResponse(response, socket);
    }
  });
}
