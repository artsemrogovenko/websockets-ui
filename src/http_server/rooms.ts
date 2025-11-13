import type { CreateRoom, InviteRoom, Rooms, UpdateRoom } from './types.ts';
import WebSocket from 'ws';
import { sendResponse } from './utils.ts';
import { getNameBySocket } from './store.ts';

const rooms = new Map<string, Rooms>();
let counter = 0;

export function createRoom(_: CreateRoom, socket: WebSocket) {
  const user = getNameBySocket(socket);
  if (user) {
    rooms.set(user.name, {
      roomId: ++counter,
      roomUsers: [user],
    });
    sendRoomsList(socket);
    const response: InviteRoom = {
      type: 'add_user_to_room',
      data: { indexRoom: counter },
      id: 0,
    };
    sendResponse(response, socket);
  }
}

export function sendRoomsList(socket: WebSocket) {
  const freeRooms = [...rooms.values()].filter((room) => {
    return room.roomUsers.length === 1;
  });
  const response: UpdateRoom = { type: 'update_room', data: freeRooms, id: 0 };
  sendResponse(response, socket);
}
