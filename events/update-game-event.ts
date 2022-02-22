import { Events, baseEvent } from "./events";

export interface UpdateGameEvent extends baseEvent{
    event: Events.UPDATE_GAME,
    data: {
        game_id: string,
        cell: number,
    }
};