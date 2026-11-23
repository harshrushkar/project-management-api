
const {
    createOrganizationService,
    getMyOrganizationsService,
    getOrganizationDetailsService,
    updateOrganizationService,
    deleteOrganizationService,
    getInviteableUsersService,
    createInvitationService,
    getOrganizationInvitationsService
} = require("./organization.service");
const {
    uploadToCloudinary
} = require("../../services/upload.service");
const cloudinary = require("../../config/cloudinary");


const createOrganization = async (req, res) => {
    let uploadedFile = null;

    try {
        const userId = req.user.id;

        let logo = null;
        let logoPublicId = null;

        // Step 1: Upload logo to Cloudinary if provided
        if (req.file) {
            const uploadResult = await uploadToCloudinary(
                req.file.buffer,
                "project-management/organizations"
            );

            logo = uploadResult.url;
            logoPublicId = uploadResult.publicId;
            uploadedFile = uploadResult.publicId;
        }

        // Step 2: Prepare organization data
        const organizationData = {
            name: req.body.name,
            industry: req.body.industry,
            website: req.body.website,
            logo,
            logoPublicId
        };

        // Step 3: Create organization
        const organization = await createOrganizationService(
            userId,
            organizationData
        );

        return res.status(201).json({
            success: true,
            message: "Organization created successfully",
            data: organization
        });

    } catch (error) {
        // Clean up uploaded image if organization creation fails
        if (uploadedFile) {
            const cloudinary = require("../../config/cloudinary");

            try {
                await cloudinary.uploader.destroy(uploadedFile);
            } catch (cleanupError) {
                console.error("Cloudinary Cleanup Error:", cleanupError.message);
            }
        }

        console.error("Create Organization Error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
};


const getMyOrganizations = async (req, res) => {
    try {
        const userId = req.user.id;

        const organizations = await getMyOrganizationsService(userId);

        return res.status(200).json({
            success: true,
            message: "Organizations fetched successfully",
            data: organizations
        });

    } catch (error) {
        console.error("Get My Organizations Error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
};

const getOrganizationDetails = async (req, res) => {
    try {
        const userId = req.user.id;
        const organizationId = req.params.organizationId;

        const organization = await getOrganizationDetailsService(
            userId,
            organizationId
        );

        return res.status(200).json({
            success: true,
            message: "Organization details fetched successfully",
            data: organization
        });

    } catch (error) {
        console.error("Get Organization Details Error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
};

const getInviteableUsers = async (req, res) => {
    try {
        // Step 1: Get data from request
        const userId = req.user.id;
        const organizationId = req.params.organizationId;

        const page = req.query.page || 1;
        const limit = req.query.limit || 10;
        const search = req.query.search || "";

        // Step 2: Call service
        const result = await getInviteableUsersService(
            userId,
            organizationId,
            Number(page),
            Number(limit),
            search
        );

        // Step 3: Send response
        return res.status(200).json({
            success: true,
            message: "Inviteable users fetched successfully",
            data: result
        });

    } catch (error) {
        console.error("Get Inviteable Users Error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
};


const updateOrganization = async (req, res) => {
    let newLogoPublicId = null;

    try {
        const userId = req.user.id;
        const organizationId = req.params.organizationId;

        const organizationData = {
            ...req.body
        };

        // Step 1: Upload new logo if provided
        if (req.file) {
            const uploadResult = await uploadToCloudinary(
                req.file.buffer,
                "project-management/organizations"
            );

            organizationData.logo = uploadResult.url;
            organizationData.logoPublicId = uploadResult.publicId;

            newLogoPublicId = uploadResult.publicId;
        }

        // Step 2: Update organization in database
        const result = await updateOrganizationService(
            userId,
            organizationId,
            organizationData
        );

        // Step 3: Delete old logo after database update succeeds
        if (result.oldLogoPublicId) {
            try {
                await cloudinary.uploader.destroy(result.oldLogoPublicId);
            } catch (cleanupError) {
                console.error(
                    "Old Logo Cleanup Error:",
                    cleanupError.message
                );
            }
        }

        return res.status(200).json({
            success: true,
            message: "Organization updated successfully",
            data: result.organization
        });

    } catch (error) {

        // Remove newly uploaded logo if database update fails
        if (newLogoPublicId) {
            try {
                await cloudinary.uploader.destroy(newLogoPublicId);
            } catch (cleanupError) {
                console.error(
                    "New Logo Cleanup Error:",
                    cleanupError.message
                );
            }
        }

        console.error("Update Organization Error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
};

const deleteOrganization = async (req, res) => {
    try {
        const userId = req.user.id;
        const organizationId = req.params.organizationId;

        const organization = await deleteOrganizationService(
            userId,
            organizationId
        );

        return res.status(200).json({
            success: true,
            message: "Organization deleted successfully",
            data: {
                id: organization.id,
                name: organization.name,
                isActive: organization.isActive
            }
        });

    } catch (error) {
        console.error("Delete Organization Error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
};

const createInvitation = async (req, res) => {
    try {
        const { organizationId } = req.params;
        const { invitedUserId, role } = req.body;
        const invitedById = req.user.id;

        const invitation = await createInvitationService(
            organizationId,
            invitedUserId,
            role,
            invitedById
        );

        return res.status(201).json({
            success: true,
            message: "Organization invitation sent successfully",
            data: invitation,
        });
    } catch (error) {
        console.error("Create invitation error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to create organization invitation",
        });
    }
};

const handleInvitationAction = async (req, res) => {
    try {
        const { invitationId } = req.params;
        const { action } = req.body;
        const userId = req.user.id;

        const result = await handleInvitationActionService(
            invitationId,
            action,
            userId
        );

        return res.status(200).json({
            success: true,
            message:
                action === "ACCEPT"
                    ? "Organization invitation accepted successfully"
                    : "Organization invitation rejected successfully",
            data: result,
        });
    } catch (error) {
        console.error("Invitation action error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to process invitation",
        });
    }
};

const getOrganizationInvitations = async (req, res) => {
    try {
        const { organizationId } = req.params;
        const userId = req.user.id;

        const invitations = await getOrganizationInvitationsService(
            organizationId,
            userId
        );

        return res.status(200).json({
            success: true,
            message: "Invitations fetched successfully",
            data: invitations,
        });
    } catch (error) {
        console.error("Get organization invitations error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message:
                error.message || "Failed to fetch organization invitations",
        });
    }
};


module.exports = {
    createOrganization,
    getMyOrganizations,
    getOrganizationDetails,
    updateOrganization,
    deleteOrganization,
    getInviteableUsers,
    createInvitation,
    handleInvitationAction,
    getOrganizationInvitations
};
