const prisma = require("../src/config/database");

async function testConnection() {
    try {
        await prisma.$connect();

        console.log("Neon PostgreSQL connected successfully!");

        const result = await prisma.$queryRaw`SELECT 1`;

        console.log("Database test result:", result);
    } catch (error) {
        console.error("Database connection failed:", error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testConnection();