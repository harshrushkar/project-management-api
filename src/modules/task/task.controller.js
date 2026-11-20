const {
    createTaskService,
    getTasksService,
    getTaskService,
    updateTaskService,
    deleteTaskService,
    assignTaskMembersService,
    removeTaskMemberService,
    updateTaskStatusService
} = require("./task.service");

const createTask = async (req, res) => {
    try {
        const {
            organizationId,
            projectId,
        } = req.params;

        const userId = req.user.id;

        const task = await createTaskService(
            userId,
            organizationId,
            projectId,
            req.body
        );

        return res.status(201).json({
            success: true,
            message: "Task created successfully",
            data: task,
        });
    } catch (error) {
        console.error("Create task error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to create task",
        });
    }
};

const getTasks = async (req, res) => {
    try {
        const {
            organizationId,
            projectId,
        } = req.params;

        const userId = req.user.id;

        const tasks = await getTasksService(
            userId,
            organizationId,
            projectId
        );

        return res.status(200).json({
            success: true,
            message: "Tasks fetched successfully",
            data: tasks,
        });
    } catch (error) {
        console.error("Get tasks error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to fetch tasks",
        });
    }
};

const getTask = async (req, res) => {
    try {
        const {
            organizationId,
            projectId,
            taskId,
        } = req.params;

        const userId = req.user.id;

        const task = await getTaskService(
            userId,
            organizationId,
            projectId,
            taskId
        );

        return res.status(200).json({
            success: true,
            message: "Task fetched successfully",
            data: task,
        });
    } catch (error) {
        console.error("Get task error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to fetch task",
        });
    }
};

const updateTask = async (req, res) => {
    try {
        const {
            organizationId,
            projectId,
            taskId,
        } = req.params;

        const userId = req.user.id;

        const task = await updateTaskService(
            userId,
            organizationId,
            projectId,
            taskId,
            req.body
        );

        return res.status(200).json({
            success: true,
            message: "Task updated successfully",
            data: task,
        });
    } catch (error) {
        console.error("Update task error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to update task",
        });
    }
};

const deleteTask = async (req, res) => {
    try {
        const {
            organizationId,
            projectId,
            taskId,
        } = req.params;

        const userId = req.user.id;

        const task = await deleteTaskService(
            userId,
            organizationId,
            projectId,
            taskId
        );

        return res.status(200).json({
            success: true,
            message: "Task deleted successfully",
            data: task,
        });
    } catch (error) {
        console.error("Delete task error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to delete task",
        });
    }
};

const assignTaskMembers = async (req, res) => {
    try {
        const {
            organizationId,
            projectId,
            taskId,
        } = req.params;

        const userId = req.user.id;

        const { userIds } = req.body;

        const taskMembers = await assignTaskMembersService(
            userId,
            organizationId,
            projectId,
            taskId,
            userIds
        );

        return res.status(201).json({
            success: true,
            message: "Task members assigned successfully",
            data: taskMembers,
        });
    } catch (error) {
        console.error("Assign task members error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message:
                error.message || "Failed to assign task members",
        });
    }
};

const removeTaskMember = async (req, res) => {
    try {
        const {
            organizationId,
            projectId,
            taskId,
            memberUserId,
        } = req.params;

        const userId = req.user.id;

        const result = await removeTaskMemberService(
            userId,
            organizationId,
            projectId,
            taskId,
            memberUserId
        );

        return res.status(200).json({
            success: true,
            message: "Task member removed successfully",
            data: result,
        });
    } catch (error) {
        console.error("Remove task member error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message:
                error.message || "Failed to remove task member",
        });
    }
};

const updateTaskStatus = async (req, res) => {
    try {
        const {
            organizationId,
            projectId,
            taskId,
        } = req.params;

        const userId = req.user.id;

        const { status } = req.body;

        const task = await updateTaskStatusService(
            userId,
            organizationId,
            projectId,
            taskId,
            status
        );

        return res.status(200).json({
            success: true,
            message: "Task status updated successfully",
            data: task,
        });
    } catch (error) {
        console.error("Update task status error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message:
                error.message || "Failed to update task status",
        });
    }
};
module.exports = {
    createTask,
    getTasks,
    getTask,
    updateTask,
    deleteTask,
    assignTaskMembers,
    removeTaskMember,
    updateTaskStatus
};