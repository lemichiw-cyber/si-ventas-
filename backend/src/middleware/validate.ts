import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (err: any) {
      const issues = err.issues?.map((i: any) => `${i.path.join('.')}: ${i.message}`).join(', ');
      return res.status(400).json({ error: issues || 'Validación fallida' });
    }
  };
