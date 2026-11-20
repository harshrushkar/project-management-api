require("dotenv").config();

const { io } = require("socket.io-client");




const socket = io("http://localhost:3000", {
    auth: {
        token: process.env.TEST_ACCESS_TOKEN,
    },
});

socket.on("connect", () => {
    console.log("Connected to Socket.IO server!");
    console.log("Client Socket ID:", socket.id);

    socket.emit("send_message", {
        message: "Hello from authenticated test client!",
    });
});

socket.on("receive_message", (data) => {
    console.log("Message from server:", data);
});

socket.on("disconnect", () => {
    console.log("Disconnected from Socket.IO server");
});

socket.on("connect_error", (error) => {
    console.log("Connection Error:", error.message);
});