import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { sendError } from "../utils/apiResponse.js";

/**
 * Higher-order middleware to validate request body/query/params using Zod
 */
export const validate = (schema: {
    body?: z.ZodType<any, any, any>;
    query?: z.ZodType<any, any, any>;
    params?: z.ZodType<any, any, any>;
}) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (schema.body) {
                req.body = await schema.body.parseAsync(req.body);
            }
            if (schema.query) {
                req.query = await schema.query.parseAsync(req.query);
            }
            if (schema.params) {
                (req as any).params = await schema.params.parseAsync(req.params);
            }
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const message = error.issues.map(e => `${e.path.join('.') || 'root'}: ${e.message}`).join(', ');
                return sendError(res, `Validation failed: ${message}`, 400);
            }
            next(error);
        }
    };
};

// ─── Common Schemas ─────────────────────────────────────────────────────────

export const CreateTransactionSchema = z.object({
    packageId: z.string().min(1),
    playerInfo: z.object({
        playerId: z.string().min(1),
        zoneId: z.string().optional(),
    }).passthrough(),
    paymentMethod: z.enum(["BAKONG", "WING", "ABA"]),
});

export const AdminLoginSchema = z.object({
    password: z.string().min(3),
});

export const UpdateSettingsSchema = z.object({
    settings: z.array(z.object({
        key: z.string(),
        value: z.string(),
    })).min(1)
});
