const prisma = require("../../config/database");
const {
    uploadToCloudinary
} = require("../../services/upload.service");

const createProjectService = async (
    userId,
    organizationId,
    projectData,
    files = []
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
    if (!["OWNER", "ADMIN"].includes(membership.role)) {
        const error = new Error(
            "You do not have permission to create projects"
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

    // Step 4: Create project
    const project = await prisma.project.create({
        data: {
            organizationId,
            name: projectData.name,
            description: projectData.description || null,
            startDate: projectData.startDate
                ? new Date(projectData.startDate)
                : null,
            dueDate: projectData.dueDate
                ? new Date(projectData.dueDate)
                : null,
            createdById: userId,
        },
    });

    // Step 5: Upload documents
    const documents = [];

    for (const file of files) {
        const uploadedFile = await uploadToCloudinary(
            file.buffer,
            `project-management/projects/${project.id}`
        );

        const document = await prisma.projectDocument.create({
            data: {
                projectId: project.id,
                uploadedById: userId,
                fileName: file.originalname,
                fileUrl: uploadedFile.url,
                publicId: uploadedFile.publicId,
                fileType: file.mimetype,
                fileSize: uploadedFile.bytes,
            },
        });

        documents.push(document);
    }

    // Step 6: Return project with documents
    return {
        ...project,
        documents,
    };
};
const getProjectsService = async (
    userId,
    organizationId
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

    // Step 3: Fetch projects
    const projects = await prisma.project.findMany({
        where: {
            organizationId,
        },
        include: {
            documents: {
                select: {
                    id: true,
                    fileName: true,
                    fileUrl: true,
                    fileType: true,
                    fileSize: true,
                    createdAt: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    // Step 4: Return projects
    return projects;
};

const getProjectService = async (
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

    // Step 3: Find project
    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            organizationId,
        },
        include: {
            documents: {
                select: {
                    id: true,
                    fileName: true,
                    fileUrl: true,
                    fileType: true,
                    fileSize: true,
                    createdAt: true,
                },
            },
        },
    });

    // Step 4: Check project
    if (!project) {
        const error = new Error(
            "Project not found"
        );

        error.statusCode = 404;
        throw error;
    }

    // Step 5: Return project
    return project;
};

const updateProjectService = async (
    userId,
    organizationId,
    projectId,
    projectData
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
    if (!["OWNER", "ADMIN"].includes(membership.role)) {
        const error = new Error(
            "You do not have permission to update projects"
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

    // Step 5: Update project
    const updatedProject = await prisma.project.update({
        where: {
            id: projectId,
        },
        data: {
            ...(projectData.name !== undefined && {
                name: projectData.name,
            }),

            ...(projectData.description !== undefined && {
                description: projectData.description || null,
            }),

            ...(projectData.status !== undefined && {
                status: projectData.status,
            }),

            ...(projectData.startDate !== undefined && {
                startDate: projectData.startDate
                    ? new Date(projectData.startDate)
                    : null,
            }),

            ...(projectData.dueDate !== undefined && {
                dueDate: projectData.dueDate
                    ? new Date(projectData.dueDate)
                    : null,
            }),
        },
    });

    // Step 6: Return updated project
    return updatedProject;
};

const deleteProjectService = async (
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

    // Step 2: Check permission
    if (membership.role !== "OWNER") {
        const error = new Error(
            "You do not have permission to delete projects"
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

    // Step 5: Delete project
    await prisma.project.delete({
        where: {
            id: projectId,
        },
    });

    // Step 6: Return success
    return true;
};

module.exports = {
    createProjectService,
    getProjectsService,
    getProjectService,
    updateProjectService,
    deleteProjectService
};