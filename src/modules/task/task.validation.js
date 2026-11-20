const {
    body,
    param,
} = require("express-validator");

const createTaskValidation = [
    param("organizationId")
        .isUUID()
        .withMessage("Invalid organization ID"),

    param("projectId")
        .isUUID()
        .withMessage("Invalid project ID"),

    body("title")
        .trim()
        .notEmpty()
        .withMessage("Task title is required")
        .isLength({ max: 255 })
        .withMessage("Task title must not exceed 255 characters"),

    body("description")
        .optional()
        .trim(),

    body("priority")
        .optional()
        .isIn([
            "LOW",
            "MEDIUM",
            "HIGH",
            "URGENT",
        ])
        .withMessage("Invalid task priority"),

    body("dueDate")
        .optional()
        .isISO8601()
        .withMessage("Invalid due date"),
];

const getTasksValidation = [
    param("organizationId")
        .isUUID()
        .withMessage("Invalid organization ID"),

    param("projectId")
        .isUUID()
        .withMessage("Invalid project ID"),
];

const getTaskValidation = [
    param("organizationId")
        .isUUID()
        .withMessage("Invalid organization ID"),

    param("projectId")
        .isUUID()
        .withMessage("Invalid project ID"),

    param("taskId")
        .isUUID()
        .withMessage("Invalid task ID"),
];

const updateTaskValidation = [
    param("organizationId")
        .isUUID()
        .withMessage("Invalid organization ID"),

    param("projectId")
        .isUUID()
        .withMessage("Invalid project ID"),

    param("taskId")
        .isUUID()
        .withMessage("Invalid task ID"),

    body("title")
        .trim()
        .notEmpty()
        .withMessage("Task title is required")
        .isLength({ max: 255 })
        .withMessage("Task title must not exceed 255 characters"),

    body("description")
        .optional()
        .trim(),

    body("priority")
        .isIn([
            "LOW",
            "MEDIUM",
            "HIGH",
            "URGENT",
        ])
        .withMessage("Invalid task priority"),

    body("dueDate")
        .optional()
        .isISO8601()
        .withMessage("Invalid due date"),
];

const deleteTaskValidation = [
    param("organizationId")
        .isUUID()
        .withMessage("Invalid organization ID"),

    param("projectId")
        .isUUID()
        .withMessage("Invalid project ID"),

    param("taskId")
        .isUUID()
        .withMessage("Invalid task ID"),
];

const assignTaskMembersValidation = [
    param("organizationId")
        .isUUID()
        .withMessage("Invalid organization ID"),

    param("projectId")
        .isUUID()
        .withMessage("Invalid project ID"),

    param("taskId")
        .isUUID()
        .withMessage("Invalid task ID"),

    body("userIds")
        .isArray({ min: 1 })
        .withMessage("At least one user ID is required"),

    body("userIds.*")
        .isUUID()
        .withMessage("Invalid user ID"),
];

const removeTaskMemberValidation = [
    param("organizationId")
        .isUUID()
        .withMessage("Invalid organization ID"),

    param("projectId")
        .isUUID()
        .withMessage("Invalid project ID"),

    param("taskId")
        .isUUID()
        .withMessage("Invalid task ID"),

    param("memberUserId")
        .isUUID()
        .withMessage("Invalid member user ID"),
];

const updateTaskStatusValidation = [
    param("organizationId")
        .isUUID()
        .withMessage("Invalid organization ID"),

    param("projectId")
        .isUUID()
        .withMessage("Invalid project ID"),

    param("taskId")
        .isUUID()
        .withMessage("Invalid task ID"),

    body("status")
        .isIn([
            "TODO",
            "IN_PROGRESS",
            "COMPLETED",
            "BLOCKED",
            "CANCELLED",
        ])
        .withMessage("Invalid task status"),
];
module.exports = {
    createTaskValidation,
    getTasksValidation,
    getTaskValidation,
    updateTaskValidation,
    deleteTaskValidation,
    assignTaskMembersValidation,
    removeTaskMemberValidation,
    updateTaskStatusValidation
};