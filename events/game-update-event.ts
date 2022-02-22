import { Events, baseEvent } from "./events";

export interface GameUpdateEvent extends baseEvent{
    event: Events.GAME_UPDATE;
    data: {
        game_id: string;
        output: string;
        turn?: string;
        draw?: boolean;
        win?: boolean;
        game_end?: boolean;
        bad_position?: boolean;
    };
};