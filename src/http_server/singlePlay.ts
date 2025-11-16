import WebSocket from 'ws';
import type { RoomUser } from './types.ts';
import { addBotToRoom, enterRoom } from './rooms.ts';
import { generateUuid, myEmitter } from './utils.ts';
import { getNameBySocket } from './store.ts';
import { addBotShips } from './botShips.ts';
import { BOT_NAME } from './constants.ts';

export const VipRoomId = new Set<string>();

export function playWithBot(socket: WebSocket) {
  const user = getNameBySocket(socket);
  if (user) {
    const roomId = generateUuid();
    VipRoomId.add(roomId);
    const botIndex = generateUuid();
    const bot: RoomUser = { index: botIndex, name: BOT_NAME };
    addBotToRoom(user.name, roomId, bot);
    enterRoom(roomId, socket, true);
    myEmitter.on('add_ships', (_gameId) => {
      addBotShips(_gameId.message, botIndex);
    });
  }
}
