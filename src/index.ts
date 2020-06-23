import { Request, Response, NextFunction } from 'express';
import {
    AMN_REQUEST_CONST,
    AMN_RESPONSE_CONST,
    pPrettyFunc,
    IReply,
    IReplyEmpty,
} from './annotations';
import error from 'amn-error';
import Prettification from './prettify';
import req from './request';

declare interface AmnRequest {
    method: string;
    in: any;
}

declare interface AmnResponse {
    data: object | undefined;
    content: boolean; // flag whether response should has message-body!
    prettification: pPrettyFunc; // reserve name, function to run prettification.
    // forward: boolean;
    status: number | undefined;
    skip: boolean; // by default middleware skip, in case no reply or empty reply are set
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
        skip: true,
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
        const skip = res[AMN_RESPONSE_CONST]!.skip;

        // skip = true means NO reply defined by middleware, hence skip response middleware.
        if (skip) {
            return next();
        }

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
        response[AMN_RESPONSE_CONST]!.skip = false;
    },

    empty: (response: Response, opt?: IReplyEmpty) => {
        response[AMN_RESPONSE_CONST]!.data = undefined; // erase if any
        response[AMN_RESPONSE_CONST]!.content = false;
        response[AMN_RESPONSE_CONST]!.status = opt?.status || undefined;
        response[AMN_RESPONSE_CONST]!.skip = false;
    },
};

export default { init, response, res, req, prettify: Prettification };
