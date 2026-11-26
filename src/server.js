const swaggerSpec = require("./config/swagger");
const express = require("express");
const authRoutes = require("./modules/auth/auth.routes");
const organizationRoutes = require("./modules/organization/organization.routes");
const projectRoutes = require("./modules/project/project.routes");
const taskRoutes = require("./modules/task/task.routes");
const cors = require("cors");
const http = require("http");
const { initializeSocket } = require("./socket/socket");

const app = express();
const server = http.createServer(app);
initializeSocket(server);


app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(express.json());

// Serve OpenAPI JSON spec
app.get("/api-docs/swagger.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
});

// Serve Swagger UI via CDN — works in both local dev and Vercel serverless
app.get("/api-docs", (req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.send(`<!DOCTYPE html>
<html>
<head>
  <title>Project Management API Docs</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function () {
      SwaggerUIBundle({
        url: "/api-docs/swagger.json",
        dom_id: "#swagger-ui",
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "StandaloneLayout",
        deepLinking: true,
        persistAuthorization: true
      });
    };
  </script>
</body>
</html>`);
});

app.use("/api/auth", authRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/organizations", projectRoutes);
app.use("/api/organizations", taskRoutes);

if (require.main === module) {
    const PORT = process.env.PORT || 3000;

    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;