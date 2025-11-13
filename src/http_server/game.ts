import { getSocketByName } from './store.ts';
import type { CreateGame, RoomUser } from './types.ts';
import { sendResponse } from './utils.ts';
import { v4 as uuidv4 } from 'uuid';

export function createGame(user: RoomUser) {
  const idGame = uuidv4();

  const socket = getSocketByName(user.name);
  if (socket) {
    const response: CreateGame = {
      type: 'create_game',
      data: {
        idGame: idGame,
        idPlayer: uuidv4(),
      },
      id: 0,
    };
    sendResponse(response, socket);
  }
}
