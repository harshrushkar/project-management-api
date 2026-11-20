const jwt = require("jsonwebtoken");

const authenticateSocket = (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error("Authentication token is required"));
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_ACCESS_SECRET
        );

        socket.user = {
            id: decoded.sub,
            role: decoded.role,
        };

        next();

    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return next(new Error("Access token has expired"));
        }

        return next(new Error("Invalid authentication token"));
    }
};

module.exports = { authenticateSocket };