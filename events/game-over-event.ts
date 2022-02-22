import { Events, baseEvent } from "./events";

export interface GameOverEvent extends baseEvent{
    event: Events.GAME_OVER;
    data: {
        message: string;
    };
};