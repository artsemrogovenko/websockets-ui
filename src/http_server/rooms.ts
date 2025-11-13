import type { CreateRoom, InviteRoom, Room, UpdateRoom } from './types.ts';
import WebSocket from 'ws';
import { getNameBySocket, notifyAll } from './store.ts';
import { createGame } from './game.ts';
import { generateUuid } from './utils.ts';

const rooms = new Map<string, Room>();
let counter = 0;

export function createRoom(_: CreateRoom, socket: WebSocket) {
  const user = getNameBySocket(socket);
  if (user && !rooms.has(user.name)) {
    rooms.set(user.name, {
      roomId: ++counter,
      roomUsers: [user],
    });
    sendRoomsList();
  }
}

export function sendRoomsList() {
  const freeRooms = [...rooms.values()].filter((room) => {
    return room.roomUsers.length === 1;
  });
  const response: UpdateRoom = { type: 'update_room', data: freeRooms, id: 0 };
  notifyAll(response);
}

function enterRoom(roomId: number | string, socket: WebSocket) {
  const user = getNameBySocket(socket);
  let key = '';
  if (user) {
    for (const [owner, room] of rooms.entries()) {
      if (roomId === room.roomId) {
        if (owner !== user.name) {
          key = owner;
          rooms.set(owner, { ...room, roomUsers: [...room.roomUsers, user] });
        }
      }
    }
    sendRoomsList();
  }
  const usersInRoom = rooms.get(key);

  if (usersInRoom && usersInRoom.roomUsers.length > 1) {
    const idGame = generateUuid();
    const usernames = usersInRoom.roomUsers;
    usernames.forEach((user) => createGame(user, idGame));
  }
}

export function inviteRoom(request: InviteRoom, socket: WebSocket) {
  const roomId = request.data.indexRoom;
  enterRoom(roomId, socket);
}
