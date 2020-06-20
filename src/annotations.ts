export const AMN_REQUEST_CONST = 'amnrequest';
export const AMN_RESPONSE_CONST = 'amnresponse';

export type pPrettyFunc = (subject: object) => any;

export interface IReply {
    name: string;
    data: object;
    // empty?: boolean;
    status?: number;
}

export interface IReplyEmpty {
    status?: number;
}
