
const express = require("express");
const upload = require("../../middleware/upload.middleware");

const {
    createOrganization,
    getMyOrganizations,
    getOrganizationDetails,
    updateOrganization,
    deleteOrganization,
    getInviteableUsers,
    createInvitation,
    handleInvitationAction,
    getOrganizationInvitations
} = require("./organization.controller");

const {
    createOrganizationValidation,
    updateOrganizationValidation,
    validateOrganizationUpdateBody,
    deleteOrganizationValidation,
    getInviteableUsersValidation,
    createInvitationValidation,
    invitationActionValidation
} = require("./organization.validation");
const {
    validateRequest
} = require("../auth/auth.validation");

const {
    authenticateUser
} = require("../../middleware/auth.middleware");

const router = express.Router();

router.post(
    "/",
    authenticateUser,
    upload.single("logo"),
    createOrganizationValidation,
    validateRequest,
    createOrganization
);

router.get(
    "/my-organizations",
    authenticateUser,
    getMyOrganizations
);

router.get(
    "/:organizationId/inviteable-users",
    authenticateUser,
    getInviteableUsersValidation,
    validateRequest,
    getInviteableUsers
);

router.get(
    "/:organizationId",
    authenticateUser,
    getOrganizationDetails
);

router.put(
    "/:organizationId",
    authenticateUser,
    upload.single("logo"),
    validateOrganizationUpdateBody,
    updateOrganizationValidation,
    validateRequest,
    updateOrganization
);

router.delete(
    "/:organizationId",
    authenticateUser,
    deleteOrganizationValidation,
    validateRequest,
    deleteOrganization
);

router.post(
    "/:organizationId/invitations",
    authenticateUser,
    createInvitationValidation,
    validateRequest,
    createInvitation
);

router.patch(
    "/invitations/:invitationId",
    authenticateUser,
    invitationActionValidation,
    validateRequest,
    handleInvitationAction
);

router.get(
    "/:organizationId/invitations",
    authenticateUser,
    getOrganizationInvitations
);


module.exports = router;
