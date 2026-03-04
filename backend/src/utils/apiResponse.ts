import { Response } from "express";

export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: any;
}

export const sendSuccess = (res: Response, data: any, message = "Success", statusCode = 200) => {
    const response: ApiResponse = {
        success: true,
        message,
        data,
    };
    return res.status(statusCode).json(response);
};

export const sendError = (res: Response, message = "Internal Server Error", statusCode = 500, error: any = null) => {
    const response: ApiResponse = {
        success: false,
        message,
        error: error?.message || error || null,
    };
    return res.status(statusCode).json(response);
};
