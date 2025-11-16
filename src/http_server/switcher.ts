import { doRandomAttack, handleAttack, handleShipsPosition } from './game.ts';
import { createRoom, inviteRoom } from './rooms.ts';
import { playWithBot } from './singlePlay.ts';
import { login } from './store.ts';
import * as MyTypes from './types.ts';
import WebSocket from 'ws';

type MessageHandler<T extends MyTypes.ObjectMessage> = (
  data: T,
  socket: WebSocket,
) => void;

export const MessageCases: {
  single_play: (socket: WebSocket) => void;
  reg: MessageHandler<MyTypes.Auth>;
  create_room: (socket: WebSocket) => void;
  add_user_to_room: MessageHandler<MyTypes.InviteRoom>;
  add_ships: MessageHandler<MyTypes.AddShips>;
  attack: (data: MyTypes.Attack) => void;
  randomAttack: MessageHandler<MyTypes.RandomAttack>;
} = {
  reg: (data: MyTypes.Auth, socket: WebSocket) => {
    login(data, socket);
  },
  create_room: (socket: WebSocket) => createRoom(socket),
  add_user_to_room: (data: MyTypes.InviteRoom, socket: WebSocket) => {
    inviteRoom(data, socket);
  },
  add_ships: (data: MyTypes.AddShips, socket: WebSocket) => {
    handleShipsPosition(data, socket);
  },
  attack: (data: MyTypes.Attack) => {
    handleAttack(data);
  },
  randomAttack: (data: MyTypes.RandomAttack) => {
    doRandomAttack(data);
  },
  single_play: (socket: WebSocket) => {
    playWithBot(socket);
  },
};
