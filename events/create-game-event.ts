import { Events,baseEvent } from "./events";
import { Player } from '../src/game';

export interface CreateGameEvent extends baseEvent{
    event: Events.CREATE_GAME;
    data: {
        creator: Player,
    };
};