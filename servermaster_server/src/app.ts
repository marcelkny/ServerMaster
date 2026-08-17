import express from 'express';
import musicManagerRoutes from './routes/music/music_manager.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

app.use(express.json());

// Routes
app.use('/api/music', musicManagerRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;