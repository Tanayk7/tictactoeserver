import { Events, baseEvent } from "./events";

export interface ServerShutdownEvent extends baseEvent{
    event: Events.SERVER_SHUTDOWN;
    data: {
        message: string;
    };
};