import type { UpdateWinners, Winner } from './types.ts';
import WebSocket from 'ws';
import { sendResponse } from './utils.ts';

const winners = new Map<string, number>();

export function sendWinnersList(socket: WebSocket) {
  const result: Winner[] = [...winners.entries()].map(([name, wins]) => {
    return { name: name, wins: wins };
  });
  const response: UpdateWinners = {
    type: 'update_winners',
    data: result,
    id: 0,
  };
  sendResponse(response, socket);
}
