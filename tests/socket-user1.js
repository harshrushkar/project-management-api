const { io } = require("socket.io-client");

const socket = io("http://localhost:3000");

socket.on("connect", () => {
    console.log("User 1 connected:", socket.id);

    socket.emit("join_room", "priya123");
});

socket.on("receive_notification", (data) => {
    console.log("User 1 received notification:", data);
});