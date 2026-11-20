const { body, param } = require("express-validator");

const createProjectValidation = [
    param("organizationId")
        .isUUID()
        .withMessage("Invalid organization ID"),

    body("name")
        .trim()
        .notEmpty()
        .withMessage("Project name is required")
        .isLength({ max: 255 })
        .withMessage("Project name must not exceed 255 characters"),

    body("description")
        .optional()
        .trim(),

    body("startDate")
        .optional()
        .isISO8601()
        .withMessage("Invalid start date"),

    body("dueDate")
        .optional()
        .isISO8601()
        .withMessage("Invalid due date"),
];

const getProjectsValidation = [
    param("organizationId")
        .isUUID()
        .withMessage("Invalid organization ID"),
];

const getProjectValidation = [
    param("organizationId")
        .isUUID()
        .withMessage("Invalid organization ID"),

    param("projectId")
        .isUUID()
        .withMessage("Invalid project ID"),
];

const updateProjectValidation = [
    param("organizationId")
        .isUUID()
        .withMessage("Invalid organization ID"),

    param("projectId")
        .isUUID()
        .withMessage("Invalid project ID"),

    body("name")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Project name cannot be empty")
        .isLength({ max: 255 })
        .withMessage("Project name must not exceed 255 characters"),

    body("description")
        .optional()
        .trim(),

    body("status")
        .optional()
        .isIn([
            "PLANNING",
            "IN_PROGRESS",
            "COMPLETED",
            "ON_HOLD",
            "CANCELLED",
        ])
        .withMessage("Invalid project status"),

    body("startDate")
        .optional()
        .isISO8601()
        .withMessage("Invalid start date"),

    body("dueDate")
        .optional()
        .isISO8601()
        .withMessage("Invalid due date"),
];

const deleteProjectValidation = [
    param("organizationId")
        .isUUID()
        .withMessage("Invalid organization ID"),

    param("projectId")
        .isUUID()
        .withMessage("Invalid project ID"),
];

module.exports = {
    createProjectValidation,
    getProjectsValidation,
    getProjectValidation,
    updateProjectValidation,
    deleteProjectValidation
};