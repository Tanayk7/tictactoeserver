import { Events, baseEvent } from "./events";

export interface GameCreatedEvent extends baseEvent{
    event: Events.GAME_CREATED;
    data: {
        message: string;
    };
};