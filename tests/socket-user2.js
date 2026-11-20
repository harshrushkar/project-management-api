const { io } = require("socket.io-client");

const socket = io("http://localhost:3000");

socket.on("connect", () => {
    console.log("User 2 connected:", socket.id);

    socket.emit("join_room", "rahul123");

    // Send notification to Priya
    socket.emit("send_notification", {
        userId: "priya123",
        message: "You received a new organization invitation!"
    });
});