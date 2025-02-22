import { Request, Response, Router } from 'express';
import dotenv from 'dotenv';
import OAuthController from '../controllers/OAuthController';

dotenv.config();

const router = Router();

router.post('/auth/callback', async (req: Request, res: Response) => {
  await OAuthController.handleCallback(req, res);
});

export default router;
