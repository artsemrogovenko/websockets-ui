import type { Auth, BaseMessage, Login } from './types';
import { sendResponse } from './utils.ts';
import WebSocket from 'ws';

const users = new Map<string, Login>();

export function login(auth: Auth, socket: WebSocket) {
  const { name, password } = auth.data;
  if (users.has(name)) {
    const login = users.get(name);
    const index = [...users.keys()].indexOf(name);
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
        users.set(name, { isOnline: true, password: password });
        const result = resultAuth(name, index);
        sendResponse(result, socket);
      }
    }
    return;
  } else {
    users.set(name, { isOnline: true, password: password });
    const index = [...users.keys()].indexOf(name);

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
