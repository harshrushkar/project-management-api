const prisma = require("../../config/database");

const createTaskService = async (
    userId,
    organizationId,
    projectId,
    taskData
) => {
    // Step 1: Check user's organization membership
    const membership = await prisma.organizationMember.findUnique({
        where: {
            userId_organizationId: {
                userId,
                organizationId,
            },
        },
    });

    if (!membership) {
        const error = new Error(
            "You are not a member of this organization"
        );

        error.statusCode = 403;
        throw error;
    }

    // Step 2: Check permission
    if (!["OWNER", "ADMIN", "MANAGER"].includes(membership.role)) {
        const error = new Error(
            "You do not have permission to create tasks"
        );

        error.statusCode = 403;
        throw error;
    }

    // Step 3: Check organization
    const organization = await prisma.organization.findUnique({
        where: {
            id: organizationId,
        },
        select: {
            id: true,
            isActive: true,
        },
    });

    if (!organization || !organization.isActive) {
        const error = new Error(
            "Organization not found or inactive"
        );

        error.statusCode = 404;
        throw error;
    }

    // Step 4: Check project
    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            organizationId,
        },
    });

    if (!project) {
        const error = new Error(
            "Project not found"
        );

        error.statusCode = 404;
        throw error;
    }

    // Step 5: Create task
    const task = await prisma.task.create({
        data: {
            projectId,
            title: taskData.title,
            description: taskData.description || null,
            priority: taskData.priority || "MEDIUM",
            dueDate: taskData.dueDate
                ? new Date(taskData.dueDate)
                : null,
            createdById: userId,
        },
    });

    // Step 6: Return task
    return task;
};

const getTasksService = async (
    userId,
    organizationId,
    projectId
) => {
    // Step 1: Check user's organization membership
    const membership = await prisma.organizationMember.findUnique({
        where: {
            userId_organizationId: {
                userId,
                organizationId,
            },
        },
    });

    if (!membership) {
        const error = new Error(
            "You are not a member of this organization"
        );

        error.statusCode = 403;
        throw error;
    }

    // Step 2: Check organization
    const organization = await prisma.organization.findUnique({
        where: {
            id: organizationId,
        },
        select: {
            id: true,
            isActive: true,
        },
    });

    if (!organization || !organization.isActive) {
        const error = new Error(
            "Organization not found or inactive"
        );

        error.statusCode = 404;
        throw error;
    }

    // Step 3: Check project
    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            organizationId,
        },
        select: {
            id: true,
        },
    });

    if (!project) {
        const error = new Error(
            "Project not found"
        );

        error.statusCode = 404;
        throw error;
    }

    // Step 4: Fetch tasks
    const tasks = await prisma.task.findMany({
        where: {
            projectId,
        },
        include: {
            members: {
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    // Step 5: Return tasks
    return tasks;
};

const getTaskService = async (
    userId,
    organizationId,
    projectId,
    taskId
) => {
    // Step 1: Check user's organization membership
    const membership = await prisma.organizationMember.findUnique({
        where: {
            userId_organizationId: {
                userId,
                organizationId,
            },
        },
    });

    if (!membership) {
        const error = new Error(
            "You are not a member of this organization"
        );

        error.statusCode = 403;
        throw error;
    }

    // Step 2: Check organization
    const organization = await prisma.organization.findUnique({
        where: {
            id: organizationId,
        },
        select: {
            id: true,
            isActive: true,
        },
    });

    if (!organization || !organization.isActive) {
        const error = new Error(
            "Organization not found or inactive"
        );

        error.statusCode = 404;
        throw error;
    }

    // Step 3: Check project
    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            organizationId,
        },
        select: {
            id: true,
        },
    });

    if (!project) {
        const error = new Error(
            "Project not found"
        );

        error.statusCode = 404;
        throw error;
    }

    // Step 4: Check task
    const task = await prisma.task.findFirst({
        where: {
            id: taskId,
            projectId,
        },
        include: {
            members: {
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            },
        },
    });

    if (!task) {
        const error = new Error(
            "Task not found"
        );

        error.statusCode = 404;
        throw error;
    }

    // Step 5: Return task
    return task;
};

const updateTaskService = async (
    userId,
    organizationId,
    projectId,
    taskId,
    taskData
) => {
    // Step 1: Check user's organization membership
    const membership = await prisma.organizationMember.findUnique({
        where: {
            userId_organizationId: {
                userId,
                organizationId,
            },
        },
    });

    if (!membership) {
        const error = new Error(
            "You are not a member of this organization"
        );

        error.statusCode = 403;
        throw error;
    }

    // Step 2: Check permission
    if (!["OWNER", "ADMIN", "MANAGER"].includes(membership.role)) {
        const error = new Error(
            "You do not have permission to update tasks"
        );

        error.statusCode = 403;
        throw error;
    }

    // Step 3: Check organization
    const organization = await prisma.organization.findUnique({
        where: {
            id: organizationId,
        },
        select: {
            id: true,
            isActive: true,
        },
    });

    if (!organization || !organization.isActive) {
        const error = new Error(
            "Organization not found or inactive"
        );

        error.statusCode = 404;
        throw error;
    }

    // Step 4: Check project
    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            organizationId,
        },
        select: {
            id: true,
        },
    });

    if (!project) {
        const error = new Error(
            "Project not found"
        );

        error.statusCode = 404;
        throw error;
    }

    // Step 5: Check task
    const task = await prisma.task.findFirst({
        where: {
            id: taskId,
            projectId,
        },
    });

    if (!task) {
        const error = new Error(
            "Task not found"
        );

        error.statusCode = 404;
        throw error;
    }

    // Step 6: Update task
    const updatedTask = await prisma.task.update({
        where: {
            id: taskId,
        },
        data: {
            title: taskData.title,
            description: taskData.description || null,
            priority: taskData.priority,
            dueDate: taskData.dueDate
                ? new Date(taskData.dueDate)
                : null,
        },
    });

    // Step 7: Return updated task
    return updatedTask;
};

const deleteTaskService = async (
    userId,
    organizationId,
    projectId,
    taskId
) => {
    // Step 1: Check user's organization membership
    const membership = await prisma.organizationMember.findUnique({
        where: {
            userId_organizationId: {
                userId,
                organizationId,
            },
        },
    });

    if (!membership) {
        const error = new Error(
            "You are not a member of this organization"
        );

        error.statusCode = 403;
        throw error;
    }

    // Step 2: Check permission
    if (!["OWNER", "ADMIN", "MANAGER"].includes(membership.role)) {
        const error = new Error(
            "You do not have permission to delete tasks"
        );

        error.statusCode = 403;
        throw error;
    }

    // Step 3: Check organization
    const organization = await prisma.organization.findUnique({
        where: {
            id: organizationId,
        },
        select: {
            id: true,
            isActive: true,
        },
    });

    if (!organization || !organization.isActive) {
        const error = new Error(
            "Organization not found or inactive"
        );

        error.statusCode = 404;
        throw error;
    }

    // Step 4: Check project
    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            organizationId,
        },
        select: {
            id: true,
        },
    });

    if (!project) {
        const error = new Error(
            "Project not found"
        );

        error.statusCode = 404;
        throw error;
    }

    // Step 5: Check task
    const task = await prisma.task.findFirst({
        where: {
            id: taskId,
            projectId,
        },
        select: {
            id: true,
        },
    });

    if (!task) {
        const error = new Error(
            "Task not found"
        );

        error.statusCode = 404;
        throw error;
    }

    // Step 6: Delete task
    await prisma.task.delete({
        where: {
            id: taskId,
        },
    });

    // Step 7: Return success
    return {
        id: taskId,
    };
};

const assignTaskMembersService = async (
    userId,
    organizationId,
    projectId,
    taskId,
    userIds
) => {
    // Step 1: Check user's organization membership
    const membership = await prisma.organizationMember.findUnique({
        where: {
            userId_organizationId: {
                userId,
                organizationId,
            },
        },
    });

    if (!membership) {
        const error = new Error(
            "You are not a member of this organization"
        );

        error.statusCode = 403;
        throw error;
    }

    // Step 2: Check permission
    if (!["OWNER", "ADMIN", "MANAGER"].includes(membership.role)) {
        const error = new Error(
            "You do not have permission to assign task members"
        );

        error.statusCode = 403;
        throw error;
    }

    // Step 3: Check organization
    const organization = await prisma.organization.findUnique({
        where: {
            id: organizationId,
        },
        select: {
            id: true,
            isActive: true,
        },
    });

    if (!organization || !organization.isActive) {
        const error = new Error(
            "Organization not found or inactive"
        );

        error.statusCode = 404;
        throw error;
    }

    // Step 4: Check project
    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            organizationId,
        },
        select: {
            id: true,
        },
    });

    if (!project) {
        const error = new Error(
            "Project not found"
        );

        error.statusCode = 404;
        throw error;
    }

    // Step 5: Check task
    const task = await prisma.task.findFirst({
        where: {
            id: taskId,
            projectId,
        },
        select: {
            id: true,
        },
    });

    if (!task) {
        const error = new Error(
            "Task not found"
        );

        error.statusCode = 404;
        throw error;
    }

    // Step 6: Check all users belong to organization
    const members = await prisma.organizationMember.findMany({
        where: {
            organizationId,
            userId: {
                in: userIds,
            },
        },
        select: {
            userId: true,
        },
    });

    if (members.length !== userIds.length) {
        const error = new Error(
            "One or more users are not members of this organization"
        );

        error.statusCode = 400;
        throw error;
    }

    // Step 7: Create task members
    const taskMembers = await prisma.taskMember.createMany({
        data: userIds.map((memberId) => ({
            taskId,
            userId: memberId,
        })),
        skipDuplicates: true,
    });

    // Step 8: Update assignedById
    await prisma.task.update({
        where: {
            id: taskId,
        },
        data: {
            assignedById: userId,
        },
    });

    // Step 9: Return result
    return taskMembers;
};

const removeTaskMemberService = async (
    userId,
    organizationId,
    projectId,
    taskId,
    memberUserId
) => {
    // Step 1: Check user's organization membership
    const membership = await prisma.organizationMember.findUnique({
        where: {
            userId_organizationId: {
                userId,
                organizationId,
            },
        },
    });

    if (!membership) {
        const error = new Error(
            "You are not a member of this organization"
        );

        error.statusCode = 403;
        throw error;
    }

    // Step 2: Check permission
    if (!["OWNER", "ADMIN", "MANAGER"].includes(membership.role)) {
        const error = new Error(
            "You do not have permission to remove task members"
        );

        error.statusCode = 403;
        throw error;
    }

    // Step 3: Check organization
    const organization = await prisma.organization.findUnique({
        where: {
            id: organizationId,
        },
        select: {
            id: true,
            isActive: true,
        },
    });

    if (!organization || !organization.isActive) {
        const error = new Error(
            "Organization not found or inactive"
        );

        error.statusCode = 404;
        throw error;
    }

    // Step 4: Check project
    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            organizationId,
        },
        select: {
            id: true,
        },
    });

    if (!project) {
        const error = new Error(
            "Project not found"
        );

        error.statusCode = 404;
        throw error;
    }

    // Step 5: Check task
    const task = await prisma.task.findFirst({
        where: {
            id: taskId,
            projectId,
        },
        select: {
            id: true,
        },
    });

    if (!task) {
        const error = new Error(
            "Task not found"
        );

        error.statusCode = 404;
        throw error;
    }

    // Step 6: Check task member
    const taskMember = await prisma.taskMember.findUnique({
        where: {
            taskId_userId: {
                taskId,
                userId: memberUserId,
            },
        },
    });

    if (!taskMember) {
        const error = new Error(
            "User is not assigned to this task"
        );

        error.statusCode = 404;
        throw error;
    }

    // Step 7: Remove task member
    await prisma.taskMember.delete({
        where: {
            taskId_userId: {
                taskId,
                userId: memberUserId,
            },
        },
    });

    // Step 8: Return result
    return {
        taskId,
        userId: memberUserId,
    };
};

const updateTaskStatusService = async (
    userId,
    organizationId,
    projectId,
    taskId,
    newStatus
) => {
    // Step 1: Check user's organization membership
    const membership = await prisma.organizationMember.findUnique({
        where: {
            userId_organizationId: {
                userId,
                organizationId,
            },
        },
    });

    if (!membership) {
        const error = new Error(
            "You are not a member of this organization"
        );

        error.statusCode = 403;
        throw error;
    }

    // Step 2: Check organization
    const organization = await prisma.organization.findUnique({
        where: {
            id: organizationId,
        },
        select: {
            id: true,
            isActive: true,
        },
    });

    if (!organization || !organization.isActive) {
        const error = new Error(
            "Organization not found or inactive"
        );

        error.statusCode = 404;
        throw error;
    }

    // Step 3: Check project
    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            organizationId,
        },
        select: {
            id: true,
        },
    });

    if (!project) {
        const error = new Error(
            "Project not found"
        );

        error.statusCode = 404;
        throw error;
    }

    // Step 4: Check task
    const task = await prisma.task.findFirst({
        where: {
            id: taskId,
            projectId,
        },
        select: {
            id: true,
            status: true,
        },
    });

    if (!task) {
        const error = new Error(
            "Task not found"
        );

        error.statusCode = 404;
        throw error;
    }

    // Step 5: Check member permission
    if (membership.role === "MEMBER") {
        const taskMember = await prisma.taskMember.findUnique({
            where: {
                taskId_userId: {
                    taskId,
                    userId,
                },
            },
        });

        if (!taskMember) {
            const error = new Error(
                "You are not assigned to this task"
            );

            error.statusCode = 403;
            throw error;
        }
    }

    // Step 6: Check if status is actually changing
    if (task.status === newStatus) {
        const error = new Error(
            "Task already has this status"
        );

        error.statusCode = 400;
        throw error;
    }

    // Step 7: Update task and create history
    const result = await prisma.$transaction(async (tx) => {
        const updatedTask = await tx.task.update({
            where: {
                id: taskId,
            },
            data: {
                status: newStatus,
            },
        });

        await tx.taskStatusHistory.create({
            data: {
                taskId,
                oldStatus: task.status,
                newStatus,
                changedById: userId,
            },
        });

        return updatedTask;
    });

    // Step 8: Return updated task
    return result;
};
module.exports = {
    createTaskService,
    getTasksService,
    getTaskService,
    updateTaskService,
    deleteTaskService,
    assignTaskMembersService,
    removeTaskMemberService,
    updateTaskStatusService
};