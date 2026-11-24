const swaggerJsdoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Project Management API",
            version: "1.0.0",
            description:
                "Complete API documentation for the Project Management System. Includes authentication, organizations, projects, tasks, invitations, and member management.",
        },
        servers: [
            {
                url: "https://project-management-api-100a.onrender.com/api",
                description: "Production server",
            },
            {
                url: "http://localhost:3000/api",
                description: "Local server",
            },
        ],
        tags: [
            {
                name: "Authentication",
                description:
                    "User registration, login, email verification, password reset, and token management",
            },
            {
                name: "Organizations",
                description:
                    "Organization CRUD, invitations, and member management",
            },
            {
                name: "Projects",
                description:
                    "Project CRUD within an organization (supports document uploads)",
            },
            {
                name: "Tasks",
                description:
                    "Task CRUD, member assignment, and status management within a project",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description:
                        "Enter your access token obtained from the /auth/login endpoint",
                },
            },
            schemas: {
                // ── Reusable response wrappers ──
                ErrorResponse: {
                    type: "object",
                    properties: {
                        success: {
                            type: "boolean",
                            example: false,
                        },
                        message: {
                            type: "string",
                            example: "Error message here",
                        },
                    },
                },
                ValidationErrorResponse: {
                    type: "object",
                    properties: {
                        success: {
                            type: "boolean",
                            example: false,
                        },
                        errors: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    type: {
                                        type: "string",
                                        example: "field",
                                    },
                                    value: {
                                        type: "string",
                                        example: "",
                                    },
                                    msg: {
                                        type: "string",
                                        example: "Name is required",
                                    },
                                    path: {
                                        type: "string",
                                        example: "name",
                                    },
                                    location: {
                                        type: "string",
                                        example: "body",
                                    },
                                },
                            },
                        },
                    },
                },

                // ── Domain models ──
                User: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string", example: "Harsh Raval" },
                        email: {
                            type: "string",
                            format: "email",
                            example: "harsh@example.com",
                        },
                        role: {
                            type: "string",
                            example: "USER",
                        },
                        isActive: { type: "boolean", example: true },
                        emailVerified: { type: "boolean", example: true },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                        },
                    },
                },
                Organization: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string", example: "Acme Corp" },
                        industry: {
                            type: "string",
                            nullable: true,
                            example: "Technology",
                        },
                        website: {
                            type: "string",
                            nullable: true,
                            example: "https://acme.com",
                        },
                        logo: {
                            type: "string",
                            nullable: true,
                            example: "https://res.cloudinary.com/.../logo.png",
                        },
                        logoPublicId: {
                            type: "string",
                            nullable: true,
                        },
                        isActive: { type: "boolean", example: true },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                        },
                        updatedAt: {
                            type: "string",
                            format: "date-time",
                        },
                    },
                },
                OrganizationWithRole: {
                    allOf: [
                        { $ref: "#/components/schemas/Organization" },
                        {
                            type: "object",
                            properties: {
                                role: {
                                    type: "string",
                                    enum: [
                                        "OWNER",
                                        "ADMIN",
                                        "MANAGER",
                                        "MEMBER",
                                    ],
                                    example: "OWNER",
                                },
                                joinedAt: {
                                    type: "string",
                                    format: "date-time",
                                },
                            },
                        },
                    ],
                },
                ProjectDocument: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        fileName: {
                            type: "string",
                            example: "requirements.pdf",
                        },
                        fileUrl: {
                            type: "string",
                            example:
                                "https://res.cloudinary.com/.../requirements.pdf",
                        },
                        fileType: {
                            type: "string",
                            example: "application/pdf",
                        },
                        fileSize: { type: "integer", example: 204800 },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                        },
                    },
                },
                Project: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        organizationId: {
                            type: "string",
                            format: "uuid",
                        },
                        name: {
                            type: "string",
                            example: "Website Redesign",
                        },
                        description: {
                            type: "string",
                            nullable: true,
                            example: "Redesign company website",
                        },
                        status: {
                            type: "string",
                            enum: [
                                "PLANNING",
                                "IN_PROGRESS",
                                "COMPLETED",
                                "ON_HOLD",
                                "CANCELLED",
                            ],
                            example: "PLANNING",
                        },
                        startDate: {
                            type: "string",
                            format: "date-time",
                            nullable: true,
                        },
                        dueDate: {
                            type: "string",
                            format: "date-time",
                            nullable: true,
                        },
                        createdById: {
                            type: "string",
                            format: "uuid",
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                        },
                        updatedAt: {
                            type: "string",
                            format: "date-time",
                        },
                        documents: {
                            type: "array",
                            items: {
                                $ref: "#/components/schemas/ProjectDocument",
                            },
                        },
                    },
                },
                TaskMember: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        taskId: { type: "string", format: "uuid" },
                        userId: { type: "string", format: "uuid" },
                        assignedAt: {
                            type: "string",
                            format: "date-time",
                        },
                        user: {
                            type: "object",
                            properties: {
                                id: {
                                    type: "string",
                                    format: "uuid",
                                },
                                name: {
                                    type: "string",
                                    example: "Harsh Raval",
                                },
                                email: {
                                    type: "string",
                                    format: "email",
                                },
                            },
                        },
                    },
                },
                Task: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        projectId: { type: "string", format: "uuid" },
                        title: {
                            type: "string",
                            example: "Design homepage",
                        },
                        description: {
                            type: "string",
                            nullable: true,
                            example: "Create the homepage mockup",
                        },
                        status: {
                            type: "string",
                            enum: [
                                "TODO",
                                "IN_PROGRESS",
                                "COMPLETED",
                                "BLOCKED",
                                "CANCELLED",
                            ],
                            example: "TODO",
                        },
                        priority: {
                            type: "string",
                            enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
                            example: "MEDIUM",
                        },
                        dueDate: {
                            type: "string",
                            format: "date-time",
                            nullable: true,
                        },
                        createdById: {
                            type: "string",
                            format: "uuid",
                        },
                        assignedById: {
                            type: "string",
                            format: "uuid",
                            nullable: true,
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                        },
                        updatedAt: {
                            type: "string",
                            format: "date-time",
                        },
                        members: {
                            type: "array",
                            items: {
                                $ref: "#/components/schemas/TaskMember",
                            },
                        },
                    },
                },
                Invitation: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        organizationId: {
                            type: "string",
                            format: "uuid",
                        },
                        invitedUserId: {
                            type: "string",
                            format: "uuid",
                        },
                        invitedById: {
                            type: "string",
                            format: "uuid",
                        },
                        role: {
                            type: "string",
                            enum: ["MEMBER", "MANAGER"],
                            example: "MEMBER",
                        },
                        status: {
                            type: "string",
                            enum: ["PENDING", "ACCEPTED", "REJECTED"],
                            example: "PENDING",
                        },
                        expiresAt: {
                            type: "string",
                            format: "date-time",
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                        },
                        updatedAt: {
                            type: "string",
                            format: "date-time",
                        },
                    },
                },
            },
        },
    },

    apis: [
        "./src/docs/auth.swagger.js",
        "./src/docs/organization.swagger.js",
        "./src/docs/project.swagger.js",
        "./src/docs/task.swagger.js",
    ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
