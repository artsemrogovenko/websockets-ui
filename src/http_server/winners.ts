import type { UpdateWinners, Winner } from './types.ts';
import { notifyAll } from './store.ts';

const winners = new Map<string, number>();

export function sendWinnersList() {
  const result: Winner[] = [...winners.entries()].map(([name, wins]) => {
    return { name: name, wins: wins };
  });
  const response: UpdateWinners = {
    type: 'update_winners',
    data: result,
    id: 0,
  };
  notifyAll(response);
}

export function update_winners(name: string) {
  const wins = winners.get(name);
 if( wins){ winners.set(name, wins + 1) }else{ winners.set(name, 1);}
  sendWinnersList();
}
