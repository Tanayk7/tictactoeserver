import { Events, baseEvent } from "./events";

export interface GameListEvent extends baseEvent{
    event: Events.GAME_LIST;
    data: {
        games: Array<string>;
    };
};