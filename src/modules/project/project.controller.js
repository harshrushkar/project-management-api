const {
    createProjectService,
    getProjectsService,
    getProjectService,
    updateProjectService,
    deleteProjectService
} = require("./project.service");

const createProject = async (req, res) => {
    try {
        const { organizationId } = req.params;
        const userId = req.user.id;

        const project = await createProjectService(
            userId,
            organizationId,
            req.body,
            req.files || []
        );

        return res.status(201).json({
            success: true,
            message: "Project created successfully",
            data: project,
        });
    } catch (error) {
        console.error("Create project error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to create project",
        });
    }
};

const getProjects = async (req, res) => {
    try {
        const { organizationId } = req.params;
        const userId = req.user.id;

        const projects = await getProjectsService(
            userId,
            organizationId
        );

        return res.status(200).json({
            success: true,
            message: "Projects fetched successfully",
            data: projects,
        });
    } catch (error) {
        console.error("Get projects error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to fetch projects",
        });
    }
};

const getProject = async (req, res) => {
    try {
        const { organizationId, projectId } = req.params;
        const userId = req.user.id;

        const project = await getProjectService(
            userId,
            organizationId,
            projectId
        );

        return res.status(200).json({
            success: true,
            message: "Project fetched successfully",
            data: project,
        });
    } catch (error) {
        console.error("Get project error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to fetch project",
        });
    }
};

const updateProject = async (req, res) => {
    try {
        const { organizationId, projectId } = req.params;
        const userId = req.user.id;

        const project = await updateProjectService(
            userId,
            organizationId,
            projectId,
            req.body
        );

        return res.status(200).json({
            success: true,
            message: "Project updated successfully",
            data: project,
        });
    } catch (error) {
        console.error("Update project error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to update project",
        });
    }
};

const deleteProject = async (req, res) => {
    try {
        const { organizationId, projectId } = req.params;
        const userId = req.user.id;

        await deleteProjectService(
            userId,
            organizationId,
            projectId
        );

        return res.status(200).json({
            success: true,
            message: "Project deleted successfully",
        });
    } catch (error) {
        console.error("Delete project error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to delete project",
        });
    }
};

module.exports = {
    createProject,
    getProjects,
    getProject,
    updateProject,
    deleteProject
};