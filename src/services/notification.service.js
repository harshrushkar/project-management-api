const { sendEmail } = require("./email.service");
const { getIO } = require("../socket/socket");

const notifyInvitationDecision = async ({
    invitation,
    action,
}) => {
    const sender = invitation.invitedBy;
    const invitedUser = invitation.invitedUser;
    const organization = invitation.organization;

    const actionText =
        action === "ACCEPT" ? "accepted" : "rejected";

    // Email
    try {
        await sendEmail({
            to: sender.email,
            subject: `Invitation ${actionText} - ${organization.name}`,
            html: `
                <h2>Organization Invitation Update</h2>

                <p>Hello ${sender.name},</p>

                <p>
                    <strong>${invitedUser.name}</strong>
                    has <strong>${actionText}</strong>
                    your invitation to join
                    <strong>${organization.name}</strong>.
                </p>

                <p>
                    <strong>Role:</strong> ${invitation.role}
                </p>

                <p>
                    <strong>Status:</strong> ${action}
                </p>

                <p>
                    Invitation ID: ${invitation.id}
                </p>
            `,
        });

        console.log(
            `Invitation decision email sent to: ${sender.email}`
        );
    } catch (error) {
        console.error(
            "Failed to send invitation decision email:",
            error.message
        );
    }

    // Socket notification
    try {
        const io = getIO();

        io.to(`user_${sender.id}`).emit(
            "organization_invitation_decision",
            {
                invitationId: invitation.id,
                organizationId: invitation.organizationId,
                organizationName: organization.name,
                invitedUserId: invitation.invitedUserId,
                invitedUserName: invitedUser.name,
                action,
                status: action,
                role: invitation.role,
            }
        );

        console.log(
            `Invitation decision notification sent to user_${sender.id}`
        );
    } catch (error) {
        console.error(
            "Failed to send invitation decision notification:",
            error.message
        );
    }
};

module.exports = {
    notifyInvitationDecision,
};