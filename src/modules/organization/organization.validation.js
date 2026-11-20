
const { body, param, query } = require("express-validator");

const createOrganizationValidation = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Organization name is required")
        .isLength({ min: 2, max: 100 })
        .withMessage("Organization name must be between 2 and 100 characters"),

    body("industry")
        .optional({ values: "null" })
        .trim()
        .isLength({ max: 100 })
        .withMessage("Industry cannot exceed 100 characters"),

    body("website")
        .optional({ values: "null" })
        .trim()
        .isURL({ require_protocol: true })
        .withMessage("Please provide a valid website URL")

];


const updateOrganizationValidation = [
    body("name")
        .optional()
        .isString()
        .withMessage("Organization name must be a string")
        .trim()
        .notEmpty()
        .withMessage("Organization name cannot be empty")
        .isLength({ min: 2, max: 100 })
        .withMessage("Organization name must be between 2 and 100 characters"),

    body("industry")
        .optional({ values: "null" })
        .isString()
        .withMessage("Industry must be a string")
        .trim()
        .isLength({ max: 100 })
        .withMessage("Industry cannot exceed 100 characters"),

    body("website")
        .optional({ values: "null" })
        .isString()
        .withMessage("Website must be a string")
        .trim()
        .isURL({ require_protocol: true })
        .withMessage("Please provide a valid website URL"),

    body("logo")
        .optional({ values: "null" })
        .isString()
        .withMessage("Logo must be a string")
        .trim()
];

// At least one field must be provided
const validateOrganizationUpdateBody = body().custom((value, { req }) => {
    const allowedFields = ["name", "industry", "website"];

    const hasTextField = allowedFields.some((field) =>
        Object.prototype.hasOwnProperty.call(value || {}, field)
    );

    const hasLogo = Boolean(req.file);

    if (!hasTextField && !hasLogo) {
        throw new Error("At least one organization field or logo is required");
    }

    return true;
});

const deleteOrganizationValidation = [
    param("organizationId")
        .isUUID()
        .withMessage("Please provide a valid organization ID")
];

const getInviteableUsersValidation = [
    // Validate organization ID from URL
    param("organizationId")
        .isUUID()
        .withMessage("Please provide a valid organization ID"),

    // Validate page number
    query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive number")
        .toInt(),

    // Validate records per page
    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be between 1 and 100")
        .toInt(),

    // Validate search keyword
    query("search")
        .optional()
        .isString()
        .withMessage("Search must be a string")
        .trim()
        .isLength({ max: 100 })
        .withMessage("Search cannot exceed 100 characters")
];

const createInvitationValidation = [
    param("organizationId")
        .isUUID()
        .withMessage("Invalid organization ID"),

    body("invitedUserId")
        .isUUID()
        .withMessage("Invalid invited user ID"),

    body("role")
        .isIn(["MEMBER", "MANAGER"])
        .withMessage("Invitation role must be MEMBER or MANAGER"),
];

const invitationActionValidation = [
    param("invitationId")
        .isUUID()
        .withMessage("Invalid invitation ID"),

    body("action")
        .isIn(["ACCEPT", "REJECT"])
        .withMessage("Action must be ACCEPT or REJECT"),
];


module.exports = {
    createOrganizationValidation,
    updateOrganizationValidation,
    validateOrganizationUpdateBody,
    deleteOrganizationValidation,
    getInviteableUsersValidation,
    createInvitationValidation,
    invitationActionValidation
};
