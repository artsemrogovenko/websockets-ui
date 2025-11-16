import type {
  InviteRoom,
  ObjectMessage,
  Room,
  RoomUser,
  UpdateRoom,
} from './types.ts';
import WebSocket from 'ws';
import { getNameBySocket, getSocketByName, notifyAll } from './store.ts';
import { createGame } from './game.ts';
import { generateUuid, sendResponse } from './utils.ts';

const rooms = new Map<string, Room>();
let counter = 0;
export function currentRoomId(): number {
  const result = counter;
  return result;
}
export function addBotToRoom(userName: string, roomId: string, bot: RoomUser) {
  rooms.set(userName, { roomId: roomId, roomUsers: [bot] });
}

export function createRoom(socket: WebSocket) {
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

export function enterRoom(
  roomId: number | string,
  socket: WebSocket,
  withBot?: boolean,
) {
  const user = getNameBySocket(socket);
  let key = user?.name || '';
  if (user) {
    if (!withBot) {
      rooms.delete(user.name);
      for (const [owner, room] of rooms.entries()) {
        if (roomId === room.roomId) {
          if (owner !== user.name) {
            key = owner;
            rooms.set(owner, { ...room, roomUsers: [...room.roomUsers, user] });
          }
        }
      }
      sendRoomsList();
    } else {
      const room = rooms.get(user.name);
      if (room)
        rooms.set(user.name, { ...room, roomUsers: [...room.roomUsers, user] });
    }
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

function findRoomOwner(names: string[]) {
  const owners = [...rooms.keys()];
  return owners
    .filter((ownerName) => {
      return ownerName === names[0] || ownerName === names[1];
    })
    .pop();
}

export function notifyRoom(names: string[], message: ObjectMessage) {
  const owner = findRoomOwner(names);
  if (owner) {
    notifyRoomByOwnerName(owner, message);
  }
}

export function notifyRoomByOwnerName(owner: string, message: ObjectMessage) {
  const room = rooms.get(owner);
  room?.roomUsers.forEach((user) => {
    const socket = getSocketByName(user.name);
    if (socket) sendResponse(message, socket);
  });
}
