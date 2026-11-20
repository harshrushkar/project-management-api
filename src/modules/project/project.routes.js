const express = require("express");

const router = express.Router();
const upload = require("../../middleware/upload.middleware");
const { authenticateUser } = require("../../middleware/auth.middleware");

const {
    validateRequest
} = require("../auth/auth.validation");

const {
    createProjectValidation,
    getProjectsValidation,
    getProjectValidation,
    updateProjectValidation,
    deleteProjectValidation
} = require("./project.validation");

const {
    createProject,
    getProjects,
    getProject,
    updateProject,
    deleteProject
} = require("./project.controller");

router.post(
    "/:organizationId/projects",
    authenticateUser,
    upload.array("documents", 10),
    createProjectValidation,
    validateRequest,
    createProject
);

router.get(
    "/:organizationId/projects",
    authenticateUser,
    getProjectsValidation,
    validateRequest,
    getProjects
);

router.get(
    "/:organizationId/projects/:projectId",
    authenticateUser,
    getProjectValidation,
    validateRequest,
    getProject
);

router.put(
    "/:organizationId/projects/:projectId",
    authenticateUser,
    updateProjectValidation,
    validateRequest,
    updateProject
);

router.delete(
    "/:organizationId/projects/:projectId",
    authenticateUser,
    deleteProjectValidation,
    validateRequest,
    deleteProject
);

module.exports = router;