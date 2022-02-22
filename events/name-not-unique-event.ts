import { Events,baseEvent } from "./events";

export interface NameNotUniqueEvent extends baseEvent{
    event: Events.NAME_NOT_UNIQUE;
    data: {
        message: string,
    };
};