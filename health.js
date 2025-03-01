import express from 'express';
import { rooms } from './app.js'; // Import rooms from app.js

const router = express.Router();

router.get('/anymo/health', (req, res) => {
    const activeRooms = rooms.size;
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const activeUsers = Array.from(rooms.values()).reduce((acc, room) => acc + room.users.size, 0);
    const totalMessages = Array.from(rooms.values()).reduce((acc, room) => acc + room.messages.length, 0);

    res.json({
        status: 'ok',
        activeRooms,
        activeUsers,
        totalMessages,
        uptime: `${Math.floor(uptime / 60)} minutes`,
        memoryUsage: {
            rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
            heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
            heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
            external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`
        },
        timestamp: new Date().toISOString()
    });
});

export default router;
