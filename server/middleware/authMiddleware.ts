import { Request, Response, NextFunction } from 'express';
import OAuthController from '../controllers/OAuthController';

export const authenticateUser = (
  req: Request,
  res: Response,
  next: NextFunction
) : void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: 'No authorization header' });
      return;
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const user = OAuthController.validateToken(token);
    res.locals.user = user; // Store user info for route handlers
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
};
