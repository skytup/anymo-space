import express from 'express';
import { Server } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import crypto from 'crypto';

// Use import.meta.url to determine the directory of the current module
const __dirname = path.dirname(new URL(import.meta.url).pathname);

const app = express();
const http = new Server(app);
const io = new SocketIOServer(http);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Store room information in memory
const rooms = new Map();
const userRooms = new Map();

function generateRoomId() {
    return crypto.randomBytes(4).toString('hex');
}

// Middleware to clean up expired rooms (older than 24 hours)
setInterval(() => {
    const yesterday = Date.now() - (24 * 60 * 60 * 1000);
    for (const [roomId, room] of rooms.entries()) {
        if (room.createdAt < yesterday) {
            rooms.delete(roomId);
        }
    }
}, 60 * 60 * 1000); // Run every hour

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('createRoom', (data) => {
        const roomId = generateRoomId();
        rooms.set(roomId, {
            name: data.roomName,
            password: data.password,
            users: new Map(),
            messages: [],
            createdAt: Date.now()
        });
        socket.emit('roomCreated', { roomId, roomName: data.roomName });
    });

    socket.on('checkRoom', (data) => {
        const room = rooms.get(data.roomId);
        if (!room) {
            socket.emit('roomError', { message: 'Room not found or expired' });
            return;
        }
        socket.emit('roomExists', { exists: true, roomName: room.name });
    });

    socket.on('verifyPassword', (data) => {
        const room = rooms.get(data.roomId);
        if (!room) {
            socket.emit('passwordError', { message: 'Room not found' });
            return;
        }

        if (room.password !== data.password) {
            socket.emit('passwordError', { message: 'Invalid password' });
            return;
        }

        socket.emit('passwordValid', {
            roomId: data.roomId,
            roomName: room.name,
            username: data.username // Include username in the response
        });
    });

    socket.on('joinRoom', (data) => {
        const room = rooms.get(data.roomId);
        if (!room) {
            socket.emit('error', { message: 'Room not found or expired' });
            return;
        }

        socket.join(data.roomId);
        room.users.set(socket.id, {
            name: data.username,
            online: true,
            joinedAt: Date.now()
        });
        userRooms.set(socket.id, data.roomId);

        // Emit room data to the joining user
        socket.emit('joined', {
            roomName: room.name,
            messages: room.messages,
            users: Array.from(room.users.values())
        });

        // Notify others in the room
        socket.to(data.roomId).emit('userList', {
            users: Array.from(room.users.values()),
            count: room.users.size
        });

        socket.to(data.roomId).emit('userJoined', {
            username: data.username,
            timestamp: Date.now()
        });
    });

    socket.on('message', (data) => {
        const roomId = userRooms.get(socket.id);
        if (!roomId) return;

        const room = rooms.get(roomId);
        const user = room.users.get(socket.id);

        const messageData = {
            id: crypto.randomBytes(8).toString('hex'),
            message: data.message,
            username: user.name,
            timestamp: Date.now()
        };

        room.messages.push(messageData);
        if (room.messages.length > 100) {
            room.messages.shift(); // Keep only last 100 messages
        }
        io.to(roomId).emit('message', messageData);
    });

    socket.on('disconnect', () => {
        const roomId = userRooms.get(socket.id);
        if (!roomId) return;

        const room = rooms.get(roomId);
        if (room) {
            const user = room.users.get(socket.id);
            room.users.delete(socket.id);
            userRooms.delete(socket.id);

            io.to(roomId).emit('userLeft', {
                username: user.name,
                timestamp: Date.now()
            });

            io.to(roomId).emit('userList', {
                users: Array.from(room.users.values()),
                count: room.users.size
            });
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
