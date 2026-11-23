const { sendEmail } = require("../../services/email.service");
const { getIO } = require("../../socket/socket");
const prisma = require("../../config/database");
const {
    notifyInvitationDecision,
} = require("../../services/notification.service");

const createOrganizationService = async (userId, organizationData) => {

    // Step 1: Check whether the user exists and is eligible
    const user = await prisma.user.findUnique({
        where: {
            id: userId
        },
        select: {
            id: true,
            isActive: true,
            emailVerified: true
        }
    });

    if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
    }

    if (!user.isActive) {
        const error = new Error("Your account is inactive");
        error.statusCode = 403;
        throw error;
    }

    if (!user.emailVerified) {
        const error = new Error("Please verify your email before creating an organization");
        error.statusCode = 403;
        throw error;
    }

    // Step 2: Create organization and assign OWNER role
    const organization = await prisma.$transaction(async (tx) => {

        const newOrganization = await tx.organization.create({
            data: {
                name: organizationData.name,
                industry: organizationData.industry || null,
                website: organizationData.website || null,
                logo: organizationData.logo || null,
                logoPublicId: organizationData.logoPublicId || null
            }
        });

        await tx.organizationMember.create({
            data: {
                userId: userId,
                organizationId: newOrganization.id,
                role: "OWNER"
            }
        });

        return newOrganization;
    });

    return organization;
};

const getMyOrganizationsService = async (userId) => {
    const organizations = await prisma.organizationMember.findMany({
        where: {
            userId: userId,
            organization: {
                isActive: true
            }
        },
        select: {
            role: true,
            joinedAt: true,
            organization: {
                select: {
                    id: true,
                    name: true,
                    logo: true,
                    industry: true,
                    website: true,
                    isActive: true,
                    createdAt: true
                }
            }
        },
        orderBy: {
            joinedAt: "desc"
        }
    });

    return organizations.map((membership) => ({
        ...membership.organization,
        role: membership.role,
        joinedAt: membership.joinedAt
    }));
};

const getOrganizationDetailsService = async (userId, organizationId) => {

    // Step 1: Find the user's membership in this organization
    const membership = await prisma.organizationMember.findUnique({
        where: {
            userId_organizationId: {
                userId: userId,
                organizationId: organizationId
            }
        },
        include: {
            organization: true
        }
    });

    // Step 2: Check membership
    if (!membership) {
        const error = new Error(
            "You are not a member of this organization"
        );
        error.statusCode = 403;
        throw error;
    }

    // Step 3: Check organization status
    if (!membership.organization.isActive) {
        const error = new Error("Organization is inactive");
        error.statusCode = 403;
        throw error;
    }

    // Step 4: Return organization details with user's role
    return {
        ...membership.organization,
        role: membership.role,
        joinedAt: membership.joinedAt
    };
};


const getInviteableUsersService = async (
    userId,
    organizationId,
    page = 1,
    limit = 10,
    search = ""
) => {
    // Step 1: Check whether the user belongs to this organization
    const membership = await prisma.organizationMember.findUnique({
        where: {
            userId_organizationId: {
                userId,
                organizationId
            }
        }
    });

    if (!membership) {
        const error = new Error(
            "You are not a member of this organization"
        );
        error.statusCode = 403;
        throw error;
    }

    // Step 2: Only OWNER and ADMIN can invite users
    if (!["OWNER", "ADMIN"].includes(membership.role)) {
        const error = new Error(
            "You do not have permission to invite users"
        );
        error.statusCode = 403;
        throw error;
    }

    // Step 3: Check whether the organization is active
    const organization = await prisma.organization.findUnique({
        where: {
            id: organizationId
        },
        select: {
            id: true,
            isActive: true
        }
    });

    if (!organization || !organization.isActive) {
        const error = new Error("Organization not found or inactive");
        error.statusCode = 404;
        throw error;
    }

    // Step 4: Calculate pagination
    const skip = (page - 1) * limit;

    // Step 5: Prepare user filters
    const where = {
        role: "USER",
        isActive: true,
        emailVerified: true,

        // Exclude users already in this organization
        memberships: {
            none: {
                organizationId: organizationId
            }
        }
    };

    // Step 6: Add search condition if search is provided
    if (search) {
        where.OR = [
            {
                name: {
                    contains: search,
                    mode: "insensitive"
                }
            },
            {
                email: {
                    contains: search,
                    mode: "insensitive"
                }
            }
        ];
    }

    // Step 7: Fetch users and total count
    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true
            },
            skip,
            take: limit,
            orderBy: {
                name: "asc"
            }
        }),

        prisma.user.count({
            where
        })
    ]);

    // Step 8: Return users and pagination details
    return {
        users,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};


const updateOrganizationService = async (
    userId,
    organizationId,
    organizationData
) => {
    // Step 1: Check membership
    const membership = await prisma.organizationMember.findUnique({
        where: {
            userId_organizationId: {
                userId,
                organizationId
            }
        }
    });

    if (!membership) {
        const error = new Error("You are not a member of this organization");
        error.statusCode = 403;
        throw error;
    }

    // Step 2: Check permission
    if (!["OWNER", "ADMIN"].includes(membership.role)) {
        const error = new Error(
            "You do not have permission to update this organization"
        );
        error.statusCode = 403;
        throw error;
    }

    // Step 3: Check organization
    const organization = await prisma.organization.findUnique({
        where: { id: organizationId }
    });

    if (!organization || !organization.isActive) {
        const error = new Error("Organization not found or inactive");
        error.statusCode = 404;
        throw error;
    }

    // Step 4: Prepare update fields
    const updateData = {};

    for (const field of ["name", "industry", "website"]) {
        if (Object.prototype.hasOwnProperty.call(organizationData, field)) {
            updateData[field] = organizationData[field];
        }
    }

    // Add new logo only when provided
    if (organizationData.logo !== undefined) {
        updateData.logo = organizationData.logo;
        updateData.logoPublicId = organizationData.logoPublicId;
    }

    // Step 5: Update existing organization
    const updatedOrganization = await prisma.organization.update({
        where: { id: organizationId },
        data: updateData
    });

    return {
        organization: updatedOrganization,
        oldLogoPublicId: organizationData.logo !== undefined
            ? organization.logoPublicId
            : null
    };
};


const deleteOrganizationService = async (userId, organizationId) => {

    return await prisma.$transaction(async (tx) => {

        // Step 1: Check user's organization membership
        const membership = await tx.organizationMember.findUnique({
            where: {
                userId_organizationId: {
                    userId,
                    organizationId
                }
            }
        });

        if (!membership) {
            const error = new Error(
                "You are not a member of this organization"
            );
            error.statusCode = 403;
            throw error;
        }

        // Step 2: Only OWNER can delete
        if (membership.role !== "OWNER") {
            const error = new Error(
                "Only the organization owner can delete this organization"
            );
            error.statusCode = 403;
            throw error;
        }

        // Step 3: Check organization status
        const organization = await tx.organization.findUnique({
            where: {
                id: organizationId
            }
        });

        if (!organization || !organization.isActive) {
            const error = new Error("Organization not found or already deleted");
            error.statusCode = 404;
            throw error;
        }

        // Step 4: Soft delete organization
        const deletedOrganization = await tx.organization.update({
            where: {
                id: organizationId
            },
            data: {
                isActive: false
            }
        });

        return deletedOrganization;
    });
};

const createInvitationService = async (
    organizationId,
    invitedUserId,
    role,
    invitedById
) => {
    // 1. Check organization and requester membership
    const requesterMembership =
        await prisma.organizationMember.findUnique({
            where: {
                userId_organizationId: {
                    userId: invitedById,
                    organizationId,
                },
            },
            include: {
                organization: true,
            },
        });

    if (!requesterMembership) {
        const error = new Error(
            "You are not a member of this organization"
        );
        error.statusCode = 403;
        throw error;
    }

    // 2. Check requester role
    if (
        requesterMembership.role !== "OWNER" &&
        requesterMembership.role !== "ADMIN"
    ) {
        const error = new Error(
            "Only organization OWNER or ADMIN can send invitations"
        );
        error.statusCode = 403;
        throw error;
    }

    // 3. Check organization is active
    if (!requesterMembership.organization.isActive) {
        const error = new Error("Organization is inactive");
        error.statusCode = 400;
        throw error;
    }

    // 4. Check invited user
    const invitedUser = await prisma.user.findUnique({
        where: {
            id: invitedUserId,
        },
    });

    if (
        !invitedUser ||
        invitedUser.role !== "USER" ||
        !invitedUser.isActive ||
        !invitedUser.emailVerified
    ) {
        const error = new Error(
            "Invited user is not eligible"
        );
        error.statusCode = 400;
        throw error;
    }

    // 5. Check if user is already a member
    const existingMember =
        await prisma.organizationMember.findUnique({
            where: {
                userId_organizationId: {
                    userId: invitedUserId,
                    organizationId,
                },
            },
        });

    if (existingMember) {
        const error = new Error(
            "User is already a member of this organization"
        );
        error.statusCode = 400;
        throw error;
    }

    // 6. Check existing pending invitation
    const existingInvitation =
        await prisma.organizationInvitation.findFirst({
            where: {
                organizationId,
                invitedUserId,
                status: "PENDING",
            },
        });

    if (existingInvitation) {
        const error = new Error(
            "A pending invitation already exists for this user"
        );
        error.statusCode = 400;
        throw error;
    }

    // 7. Create invitation
    const expiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    const invitation =
        await prisma.organizationInvitation.create({
            data: {
                organizationId,
                invitedUserId,
                invitedById,
                role,
                status: "PENDING",
                expiresAt,
            },
        });

    // 8. Send invitation email
    try {
        await sendEmail({
            to: invitedUser.email,
            subject: `Invitation to join ${requesterMembership.organization.name}`,
            html: `
      <h2>Organization Invitation</h2>

      <p>Hello ${invitedUser.name},</p>

      <p>
        You have been invited to join
        <strong>${requesterMembership.organization.name}</strong>.
      </p>

      <p>
        <strong>Role:</strong> ${role}
      </p>

      <p>
        <strong>Invitation expires:</strong>
        ${invitation.expiresAt.toLocaleString()}
      </p>

      <p>
        Please open your Project Management App to accept or reject this invitation.
      </p>

      <p>
        Invitation ID: ${invitation.id}
      </p>
    `,
        });

        console.log(`Invitation email sent to: ${invitedUser.email}`);
    } catch (emailError) {
        console.error("Failed to send invitation email:", emailError.message);
    }

    try {
        const io = getIO();

        io.to(`user_${invitedUserId}`).emit("organization_invitation", {
            invitationId: invitation.id,
            organizationId,
            organizationName: requesterMembership.organization.name,
            role: invitation.role,
            expiresAt: invitation.expiresAt,
        });

        console.log(
            `Invitation notification sent to user_${invitedUserId}`
        );
    } catch (socketError) {
        console.error(
            "Failed to send invitation notification:",
            socketError.message
        );
    }

    return invitation;
};

const handleInvitationActionService = async (
    invitationId,
    action,
    userId
) => {
    // 1. Find invitation
    const invitation =
        await prisma.organizationInvitation.findUnique({
            where: {
                id: invitationId,
            },
            include: {
                invitedBy: true,
                invitedUser: true,
                organization: true,
            },
        });

    if (!invitation) {
        const error = new Error("Invitation not found");
        error.statusCode = 404;
        throw error;
    }

    // 2. Check invited user
    if (invitation.invitedUserId !== userId) {
        const error = new Error(
            "You are not authorized to manage this invitation"
        );
        error.statusCode = 403;
        throw error;
    }

    // 3. Check status
    if (invitation.status !== "PENDING") {
        const error = new Error(
            `Invitation is already ${invitation.status.toLowerCase()}`
        );
        error.statusCode = 400;
        throw error;
    }

    // 4. Check expiry
    if (invitation.expiresAt < new Date()) {
        const error = new Error("Invitation has expired");
        error.statusCode = 400;
        throw error;
    }

    // 5. Reject
    if (action === "REJECT") {
        const updatedInvitation =
            await prisma.organizationInvitation.update({
                where: {
                    id: invitationId,
                },
                data: {
                    status: "REJECTED",
                },
            });

        // DB operation succeeded
        await notifyInvitationDecision({
            invitation,
            action: "REJECT",
        });

        return updatedInvitation;
    }

    // 6. Accept
    if (action === "ACCEPT") {
        const result = await prisma.$transaction(async (tx) => {
            const existingMember = await tx.organizationMember.findUnique({
                where: {
                    userId_organizationId: {
                        userId,
                        organizationId: invitation.organizationId,
                    },
                },
            });

            if (existingMember) {
                throw new Error("User is already a member of this organization");
            }

            const member = await tx.organizationMember.create({
                data: {
                    userId,
                    organizationId: invitation.organizationId,
                    role: invitation.role,
                },
            });

            await tx.organizationInvitation.update({
                where: {
                    id: invitationId,
                },
                data: {
                    status: "ACCEPTED",
                },
            });

            return member;
        });

        // DB operation succeeded
        await notifyInvitationDecision({
            invitation,
            action: "ACCEPT",
        });

        return result;
    }
};

const getOrganizationInvitationsService = async (
    organizationId,
    userId
) => {
    // 1. Check organization and requester membership
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

    // 2. Check organization is active
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

    // 3. OWNER / ADMIN can see invitations sent by the organization
    if (["OWNER", "ADMIN"].includes(membership.role)) {
        return prisma.organizationInvitation.findMany({
            where: {
                organizationId,
            },
            include: {
                invitedUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                invitedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    }

    // 4. Other members can only see invitations received by themselves
    return prisma.organizationInvitation.findMany({
        where: {
            organizationId,
            invitedUserId: userId,
        },
        include: {
            organization: {
                select: {
                    id: true,
                    name: true,
                },
            },
            invitedBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};


module.exports = {
    createOrganizationService,
    getMyOrganizationsService,
    getOrganizationDetailsService,
    updateOrganizationService,
    deleteOrganizationService,
    getInviteableUsersService,
    createInvitationService,
    handleInvitationActionService,
    getOrganizationInvitationsService
};
