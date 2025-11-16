import type WebSocket from 'ws';
import type { Attack, Position, RoomUser } from './types.ts';
import { addBotToRoom, enterRoom } from './rooms.ts';
import { generateUuid, getRandomDigit, myEmitter } from './utils.ts';
import { getNameBySocket } from './store.ts';
import { addBotShips } from './botShips.ts';
import { BOT_NAME } from './constants.ts';
import { handleAttack } from './game.ts';

export const vipRooms = new Map<string, Position[]>(); //gameid , bot targets available

export function playWithBot(socket: WebSocket) {
  const user = getNameBySocket(socket);
  if (user) {
    const roomId = generateUuid();
    const botIndex = generateUuid();
    const bot: RoomUser = { index: botIndex, name: BOT_NAME };
    addBotToRoom(user.name, roomId, bot);
    enterRoom(roomId, socket, true);
    vipRooms.set(roomId, generateNums());

    myEmitter.on('add_ships', (_gameId) => {
      const { gameId, owner } = _gameId.message;
      if (user.name === owner) {
        addBotShips(gameId, botIndex);
        botAttack(roomId, gameId, botIndex);
      }
    });
    myEmitter.on('attack', (_gameId) => {
      const { gameId, owner } = _gameId.message;
      if (user.name === owner) {
        botAttack(roomId, gameId, botIndex);
      }
    });
  }
}

function botAttack(roomId: string, gameId: string, botIndex: string) {
  const { x, y }: Position = updateTargets(roomId);
  const request: Attack = {
    data: { gameId: gameId, indexPlayer: botIndex, x: x, y: y },
    type: 'attack',
    id: 0,
  };
  handleAttack(request);
}

function updateTargets(roomId: string) {
  const available = vipRooms.get(roomId);
  let target: Position = { x: 0, y: 0 };
  if (available) {
    target = available[getRandomDigit(available.length - 1)];
    vipRooms.set(
      roomId,
      available.filter((value) => value !== target),
    );
  }
  return target;
}

function generateNums() {
  const coordinates: Position[] = [];
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      coordinates.push({ x: i, y: j });
    }
  }
  return coordinates;
}
