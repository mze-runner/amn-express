export const AMN_REQUEST_CONST = 'amnrequest';
export const AMN_RESPONSE_CONST = 'amnresponse';

export type pPrettyFunc = (subject: object) => any;

export interface IReply {
    name: string;
    payload: object;
    status?: number;
}

export interface IReplyEmpty {
    // helps to override HTTP response status code
    status?: number;
}
