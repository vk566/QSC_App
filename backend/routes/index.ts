// backend/routes/index.ts
import { Router } from 'express';
import { router as coreRouter } from '../routes';

const router = Router();

// Forward to the main router
router.use('/', coreRouter);

export default router;
