const http = require("http");
const app = require("./app");
const { initializeSocket } = require("./socket/socket");

const server = http.createServer(app);

initializeSocket(server);

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});