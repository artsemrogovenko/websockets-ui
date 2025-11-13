import { handleShipsPosition } from './game.ts';
import { createRoom, inviteRoom } from './rooms.ts';
import { login } from './store.ts';
import * as MyTypes from './types.ts';
import WebSocket from 'ws';

type MessageHandler<T extends MyTypes.ObjectMessage> = (
  data: T,
  socket: WebSocket,
) => void;

export const MessageCases: {
  reg: MessageHandler<MyTypes.Auth>;
  update_winners: MessageHandler<MyTypes.UpdateWinners>;
  create_room: MessageHandler<MyTypes.CreateRoom>;
  add_user_to_room: MessageHandler<MyTypes.InviteRoom>;
  create_game: MessageHandler<MyTypes.CreateGame>;
  update_room: MessageHandler<MyTypes.UpdateRoom>;
  add_ships: MessageHandler<MyTypes.AddShips>;
  start_game: MessageHandler<MyTypes.StartGame>;
  attack: MessageHandler<MyTypes.Attack | MyTypes.AttackFeedback>;
  randomAttack: MessageHandler<MyTypes.RandomAttack>;
  turn: MessageHandler<MyTypes.PlayerTurn>;
  finish: MessageHandler<MyTypes.FinishGame>;
} = {
  reg: (data: MyTypes.Auth, socket: WebSocket) => {
    login(data, socket);
  },
  update_winners: () => {},
  create_room: (data: MyTypes.CreateRoom, socket: WebSocket) =>
    createRoom(data, socket),
  add_user_to_room: (data: MyTypes.InviteRoom, socket: WebSocket) => {
    inviteRoom(data, socket);
  },
  create_game: () => {},
  update_room: () => {},
  add_ships: (data: MyTypes.AddShips, socket: WebSocket) => {
    handleShipsPosition(data, socket);
  },
  start_game: () => {},
  attack: () => {},
  randomAttack: () => {},
  turn: () => {},
  finish: () => {},
};
