// backend/server.ts
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { router as apiRoutes } from './routes';

console.log('[server]: Initializing application...'); // Immediate debug log

const app: Express = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0'; // Explicitly bind to IPv4 to avoid localhost resolution issues

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies

// Routes
app.use('/api', apiRoutes);

// Health Check
app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start Server
const server = app.listen(PORT, HOST, () => {
    console.log(`[server]: Server is running on http://${HOST}:${PORT}`);
    console.log(`[server]: Mode: ${process.env.NODE_ENV || 'development'}`);
});

// Handle startup errors (e.g., EADDRINUSE)
server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`[server]: Port ${PORT} is already in use.`);
    } else {
        console.error('[server]: Server failed to start:', error);
    }
});