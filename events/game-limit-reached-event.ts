import { Events, baseEvent } from "./events";

export interface GameLimitReachedEvent extends baseEvent{
    event: Events.GAME_LIMIT_REACHED;
    data: {
        message: string;
    };
};