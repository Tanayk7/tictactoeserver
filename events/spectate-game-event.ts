import { Player } from "../src/game";
import { Events, baseEvent } from "./events";

export interface SpectateGameEvent extends baseEvent{
    event: Events.SPECTATE_GAME;
    data: {
        game: string;
        player: Player;
    };
};