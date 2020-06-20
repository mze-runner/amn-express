import { Request } from 'express';
import error from 'amn-error';

/**
 * Get client input (body, query, params)
 * @param {Request} req node js Request object
 * @param {string} container [optional] one of property to hold clients data (body, params, query)
 */
export const input = (
    req: Request,
    container?: 'body' | 'params' | 'query'
) => {
    if (!container) {
        const { body, params, query } = req;
        return Object.assign(body, params, query);
    }
    if (container) {
        const input = req[container];
        if (!input) {
            throw error.create(
                500,
                'INTERNAL_SERVER_ERROR',
                'AMN: internal critical error',
                `Unable to read client input from ${container}`
            );
        }
        return input;
    }
    throw error.create(
        500,
        'INTERNAL_SERVER_ERROR',
        'AMN: internal critical error'
    );
};
