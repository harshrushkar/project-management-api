
const jwt = require("jsonwebtoken");

const authenticateUser = (req, res, next) => {
    try {
        // 1. Get Authorization header
        const authHeader = req.headers.authorization;

        // 2. Check whether token exists
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication token is required",
            });
        }

        // 3. Extract token
        const token = authHeader.split(" ")[1];

        // 4. Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_ACCESS_SECRET
        );

        // 5. Store user information in request
        req.user = {
            id: decoded.sub,
            role: decoded.role,
        };

        // 6. Continue to next middleware/controller
        next();

    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Access token has expired",
            });
        }

        return res.status(401).json({
            success: false,
            message: "Invalid authentication token",
        });
    }
};

module.exports = { authenticateUser };
