import { Player } from "../src/game";
import { Events, baseEvent } from "./events";

export interface PlayerConnectedEvent extends baseEvent{
    event: Events.PLAYER_CONNECTED;
    data: {
        player: Player
    };
};