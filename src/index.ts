import { Request, Response, NextFunction } from 'express';
import {
    AMN_REQUEST_CONST,
    AMN_RESPONSE_CONST,
    pPrettyFunc,
    IReply,
    IReplyEmpty,
} from './annotations';
import error from 'amn-error';
import { Prettification } from './prettify';
export * as req from './request';
// export * as req from './response';
export { Prettification as prettify } from './prettify';

declare interface AmnRequest {
    method: string;
    in: any;
}

declare interface AmnResponse {
    data: object | undefined;
    content: boolean; // flag whether response should has message-body!
    // prettification(foo: object): object; // reserve name, function to run prettification.
    prettification: pPrettyFunc; // reserve name, function to run prettification.
    // forward: boolean;
    status: number | undefined;
}

declare global {
    namespace Express {
        interface Request {
            [AMN_REQUEST_CONST]?: AmnRequest;
        }

        interface Response {
            [AMN_RESPONSE_CONST]?: AmnResponse;
        }
    }
}

const _checkSymbol = (object: Request | Response, name: string) => {
    const arr = Object.getOwnPropertyNames(object);
    return arr.indexOf(name) > -1;
};

export const init = (req: Request, res: Response, next: NextFunction) => {
    if (_checkSymbol(req, AMN_REQUEST_CONST)) {
        delete req[AMN_REQUEST_CONST];
    }
    if (_checkSymbol(res, AMN_RESPONSE_CONST)) {
        delete res[AMN_RESPONSE_CONST];
    }

    const { method, body, query } = req;
    req[AMN_REQUEST_CONST] = {
        method: method,
        in: { ...query, ...body },
    };

    res[AMN_RESPONSE_CONST] = {
        data: undefined,
        content: false, // flag whether response should has message-body!
        // reference: string; // reserved for a function name reference
        prettification: Prettification.forward, // reserve name, function to run prettification.
        // forward: boolean;
        status: undefined,
    };
    next();
};

export const response = (req: Request, res: Response, next: NextFunction) => {
    try {
        //
        // logger.debug('amn:response');
        const method = req[AMN_REQUEST_CONST]!.method as string;
        const isContent = res[AMN_RESPONSE_CONST]!.content as boolean;
        const customStatus = res[AMN_RESPONSE_CONST]!.status;

        const _retCode = function (method: string, content: boolean) {
            return method === 'POST' ? 201 : !content ? 204 : 200;
        };
        const retCode = !customStatus
            ? _retCode(method, isContent)
            : customStatus;
        if (!isContent) {
            return res.sendStatus(retCode);
        }
        const prettification = res[AMN_RESPONSE_CONST]?.prettification;
        if (typeof prettification !== 'function') {
            throw error.create(
                500,
                'INTERNAL_SERVER_ERROR',
                'critical amn internal error',
                'AMN: prettification functions is not provided'
            );
        }
        const rowdata = res[AMN_RESPONSE_CONST]!.data as object;
        const retBody = prettification(rowdata);
        return res.status(retCode).json(retBody);
    } catch (err) {
        next(err);
    }
};

export const res = {
    reply: (response: Response, opt: IReply) => {
        const foo = Prettification.get(opt.name);
        if (!foo) {
            throw error.create(
                500,
                'INTERNAL_SERVER_ERROR',
                'critical amn internal error',
                'AMN: prettification function not found'
            );
        }
        const data = opt.data;
        if (!data) {
            throw error.create(
                500,
                'INTERNAL_SERVER_ERROR',
                'critical amn internal error',
                'AMN: prettification data is not provided'
            );
        }
        response[AMN_RESPONSE_CONST]!.prettification = foo;
        response[AMN_RESPONSE_CONST]!.data = data;
        response[AMN_RESPONSE_CONST]!.content = true;
        response[AMN_RESPONSE_CONST]!.status = opt?.status || undefined;
    },

    empty: (response: Response, opt?: IReplyEmpty) => {
        response[AMN_RESPONSE_CONST]!.data = undefined; // erase if any
        response[AMN_RESPONSE_CONST]!.content = false;
        response[AMN_RESPONSE_CONST]!.status = opt?.status || undefined;
    },
};
