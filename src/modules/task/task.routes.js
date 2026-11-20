const express = require("express");

const router = express.Router();

const {
    authenticateUser,
} = require("../../middleware/auth.middleware");

const {
    validateRequest,
} = require("../auth/auth.validation");

const {
    createTaskValidation,
    getTasksValidation,
    getTaskValidation,
    updateTaskValidation,
    deleteTaskValidation,
    assignTaskMembersValidation,
    removeTaskMemberValidation,
    updateTaskStatusValidation,
} = require("./task.validation");

const {
    createTask,
    getTasks,
    getTask,
    updateTask,
    deleteTask,
    assignTaskMembers,
    removeTaskMember,
    updateTaskStatus,
} = require("./task.controller");

router.post(
    "/:organizationId/projects/:projectId/tasks",
    authenticateUser,
    createTaskValidation,
    validateRequest,
    createTask
);

router.get(
    "/:organizationId/projects/:projectId/tasks",
    authenticateUser,
    getTasksValidation,
    validateRequest,
    getTasks
);

router.get(
    "/:organizationId/projects/:projectId/tasks/:taskId",
    authenticateUser,
    getTaskValidation,
    validateRequest,
    getTask
);

router.put(
    "/:organizationId/projects/:projectId/tasks/:taskId",
    authenticateUser,
    updateTaskValidation,
    validateRequest,
    updateTask
);

router.delete(
    "/:organizationId/projects/:projectId/tasks/:taskId",
    authenticateUser,
    deleteTaskValidation,
    validateRequest,
    deleteTask
);

router.post(
    "/:organizationId/projects/:projectId/tasks/:taskId/members",
    authenticateUser,
    assignTaskMembersValidation,
    validateRequest,
    assignTaskMembers
);

router.delete(
    "/:organizationId/projects/:projectId/tasks/:taskId/members/:memberUserId",
    authenticateUser,
    removeTaskMemberValidation,
    validateRequest,
    removeTaskMember
);

router.patch(
    "/:organizationId/projects/:projectId/tasks/:taskId/status",
    authenticateUser,
    updateTaskStatusValidation,
    validateRequest,
    updateTaskStatus
);

module.exports = router;