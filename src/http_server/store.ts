import { sendRoomsList } from './rooms.ts';
import type { Auth, BaseMessage, Login, RoomUser } from './types';
import { sendResponse } from './utils.ts';
import WebSocket from 'ws';
import { sendWinnersList } from './winners.ts';

export const sockets = new Map<string, WebSocket>(); // username, socket

const logins = new Map<string, Login>();

export function login(auth: Auth, socket: WebSocket) {
  const { name, password } = auth.data;
  socket.on('close', () => signOut(name));

  if (logins.has(name)) {
    const login = logins.get(name);
    const index = getIndex(name);
    if (login?.isOnline) {
      const result = resultAuth(
        name,
        index,
        true,
        'the user is already logged in',
      );
      sendResponse(result, socket);
    } else {
      if (login?.password === password) {
        signIn(name, password, socket);
        const result = resultAuth(name, index);
        sendResponse(result, socket);
      }
    }
    return;
  } else {
    signIn(name, password, socket);
    const index = getIndex(name);
    const result = resultAuth(name, index);

    sendResponse(result, socket);
  }
}

function resultAuth(
  name: string,
  index: number | string,
  error = false,
  message = 'OK',
): BaseMessage {
  return {
    type: 'reg',
    data: {
      name: name,
      index: index,
      error: error,
      errorText: message,
    },
    id: 0,
  };
}

function getIndex(name: string) {
  return [...logins.keys()].indexOf(name);
}

function signOut(name: string) {
  const login = logins.get(name);
  if (login) {
    logins.set(name, { ...login, isOnline: false });
    sockets.delete(name);
  }
}

function signIn(name: string, password: string, socket: WebSocket) {
  logins.set(name, { isOnline: true, password: password });
  sockets.set(name, socket);
  sendRoomsList(socket);
  sendWinnersList(socket);
}

export function getNameBySocket(ws: WebSocket): RoomUser | null {
  for (const [name, socket] of sockets.entries()) {
    if (socket === ws) {
      return { index: getIndex(name), name: name };
    }
  }
  return null;
}
