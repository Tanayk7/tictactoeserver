import { Events, baseEvent } from "./events";

export interface GamesFullEvent extends baseEvent{
    event: Events.GAMES_FULL;
    data: {
        message: string;
    };
};