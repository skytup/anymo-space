import express from 'express';
import { rooms } from './app.js'; // Import rooms from app.js

const router = express.Router();

router.get('/anymo/health', (req, res) => {
    const activeRooms = rooms.size;
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    res.json({
        status: 'ok',
        activeRooms,
        uptime,
        memoryUsage,
        timestamp: new Date().toISOString()
    });
});

export default router;
