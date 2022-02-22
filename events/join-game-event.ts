import { Player } from "../src/game";
import { Events, baseEvent } from "./events";

export interface JoinGameEvent extends baseEvent{
    event: Events.JOIN_GAME;
    data: {
        game: string;
        player: Player;
    };
};