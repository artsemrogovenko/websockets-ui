import WebSocket, { type RawData } from 'ws';
import * as MyTypes from './types.ts';
import { MessageCases } from './switcher.ts';
import { v4 as uuidv4 } from 'uuid';
import type { AddShips, CoordinateState, Ship, UserShips } from './types.ts';
import EventEmitter from 'events';

type MessageEvent = {
  owner: string;
  gameId: string;
};
export const myEmitter = new EventEmitter<{
  [K in MyTypes.MessagesTypes]: [{ message: MessageEvent }];
}>();

function isMessageType(obj: unknown): obj is MyTypes.RawMessage {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'type' in obj &&
    'data' in obj &&
    'id' in obj &&
    typeof obj.type === 'string' &&
    typeof obj.data === 'string' &&
    obj.id === 0
  );
}

function parser(data: RawData): MyTypes.ObjectMessage {
  const parsed = Object.assign({}, JSON.parse(data.toString()));
  if (!isMessageType(parsed)) {
    throw Error('Invalid format message');
  }
  // console.log(parsed);
  return {
    type: parsed.type,
    data: parsed.data ? JSON.parse(parsed.data) : parsed.data,
    id: parsed.id,
  };
}

export function handleMessage(raw: RawData, socket: WebSocket) {
  const parsed = parser(raw);
  const type = parsed.type;
  if (!Object.keys(MessageCases).includes(type)) {
    console.error('Unknown type message', type);
  }

  switch (type) {
    case 'reg':
      MessageCases.reg(parsed as MyTypes.Auth, socket);
      break;
    case 'create_room':
      MessageCases.create_room(socket);
      break;
    case 'add_user_to_room':
      MessageCases.add_user_to_room(parsed as MyTypes.InviteRoom, socket);
      break;
    case 'add_ships':
      MessageCases.add_ships(parsed as MyTypes.AddShips, socket);
      break;
    case 'attack':
      MessageCases.attack(parsed as MyTypes.Attack);
      break;
    case 'randomAttack':
      MessageCases.randomAttack(parsed as MyTypes.RandomAttack, socket);
      break;
    case 'single_play':
      MessageCases.single_play(socket);
      break;
    default:
      break;
  }
}

export function stringify(message: MyTypes.BaseMessage): string {
  const transformed = JSON.stringify(message.data);
  const result = {
    type: message.type,
    data: transformed,
    id: message.id,
  };
  return JSON.stringify(result);
}

export function sendResponse(message: MyTypes.BaseMessage, socket: WebSocket) {
  const response = stringify(message);
  socket.send(response);
}

export function generateUuid() {
  return uuidv4();
}

export function getRandomDigit(value: number = 10) {
  return Math.floor(Math.random() * value);
}

export function makeCoordinates(userGrid: AddShips): UserShips {
  const data = userGrid.data;
  const ships = data.ships;

  const result: UserShips = {
    userId: data.indexPlayer,
    positions: [],
  };
  ships.forEach((s) => {
    result.positions.push(computePoints(s));
  });
  return result;
}

function computePoints(ship: Ship) {
  const points: CoordinateState[] = [];
  const position = ship.position;

  if (ship.direction) {
    for (let index = 0; index < ship.length; index++) {
      points.push(packing({ x: position.x, y: position.y + index }));
    }
  } else {
    for (let index = 0; index < ship.length; index++) {
      points.push(packing({ x: position.x + index, y: position.y }));
    }
  }
  return { isKilled: false, coordinates: points };
}

function packing(value: object): CoordinateState {
  return { breaked: false, coordinate: JSON.stringify(value) };
}

export function newEvent(type: MyTypes.MessagesTypes, message: MessageEvent) {
  myEmitter.emit(type, { message: message });
}
