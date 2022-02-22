import { Events,baseEvent } from "./events";

export interface ClientConnectedEvent extends baseEvent{
    event: Events.CLIENT_CONNECTED;
    data: {
        message: string;
        name: string;
        id: string;
    };
};