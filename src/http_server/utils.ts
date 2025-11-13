import WebSocket, { type RawData } from 'ws';
import * as MyTypes from './types.ts';
import { MessageCases } from './switcher.ts';

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
  console.log(parsed);
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
    // case 'update_winners':
    //   MessageCases.reg(parsed as MyTypes.UpdateWinners, socket);
    //   break;
    case 'create_room':
      MessageCases.create_room(parsed as MyTypes.CreateRoom, socket);
      break;
    case 'add_user_to_room':
      MessageCases.add_user_to_room(parsed as MyTypes.InviteRoom, socket);
      break;
    // case 'create_game':
    //   MessageCases.create_game(parsed as MyTypes.CreateGame, socket);
    //   break;
    // case 'update_room':
    //   MessageCases.update_room(parsed as MyTypes.UpdateRoom, socket);
    //   break;
    // case 'start_game':
    //   MessageCases.reg(parsed as MyTypes.StartGame, socket);
    //   break;
    // case 'add_ships':
    //   MessageCases.reg(parsed as MyTypes.AddShips, socket);
    //   break;
    // case 'attack':
    //   MessageCases.reg(
    //     parsed as MyTypes.Attack | MyTypes.AttackFeedback,
    //     socket,
    //   );
    //   break;
    // case 'randomAttack':
    //   MessageCases.reg(parsed as MyTypes.RandomAttack, socket);
    //   break;
    // case 'turn':
    //   MessageCases.reg(parsed as MyTypes.PlayerTurn, socket);
    //   break;
    // case 'finish':
    //   MessageCases.reg(parsed as MyTypes.FinishGame, socket);
    //   break;

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
