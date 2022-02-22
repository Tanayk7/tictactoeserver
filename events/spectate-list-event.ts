import { Events, baseEvent } from "./events";

export interface SpectateListEvent extends baseEvent{
    event: Events.SPECTATE_LIST;
    data: {
        games: Array<string>;
    };
};