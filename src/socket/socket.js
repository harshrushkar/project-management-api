
const { Server } = require("socket.io");
const { authenticateSocket } = require("./socket.middleware");

let io;

const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
            methods: ["GET", "POST"],
        },
    });

    // Authenticate every socket connection
    io.use(authenticateSocket);

    io.on("connection", (socket) => {
        const userId = socket.user.id;

        console.log("Authenticated user connected:", userId);
        console.log("Socket ID:", socket.id);

        // Automatically join the authenticated user's private room
        const roomName = `user_${userId}`;
        socket.join(roomName);

        console.log(`User joined private room: ${roomName}`);

        socket.on("disconnect", () => {
            console.log("User disconnected:", userId);
        });

        socket.on("test_notification", (data) => {
            const roomName = `user_${data.userId}`;

            io.to(roomName).emit("receive_notification", {
                message: data.message,
                receivedAt: new Date(),
            });

            console.log(`Notification sent to: ${roomName}`);
        });

        // Temporary event for learning and connection testing
        socket.on("send_message", (data) => {
            console.log("Message received:", data);

            socket.emit("receive_message", {
                message: data.message,
                receivedAt: new Date(),
            });
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO has not been initialized");
    }

    return io;
};

module.exports = { initializeSocket, getIO };
