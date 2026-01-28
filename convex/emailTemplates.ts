export const TEMPLATES = {
    LEASE_CREATED: (url: string, address: string) => ({
        subject: `New Lease Agreement: ${address}`,
        html: `
            <h1>New Lease Agreement</h1>
            <p>A new lease agreement for <strong>${address}</strong> has been created for you.</p>
            <p>Please review and sign the document here:</p>
            <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px;">View Lease</a>
        `
    }),
    TENANT_SIGNED: (url: string, tenantName: string, address: string) => ({
        subject: `Lease Signed: ${tenantName} - ${address}`,
        html: `
            <h1>Lease Signed</h1>
            <p><strong>${tenantName}</strong> has signed the lease for <strong>${address}</strong>.</p>
            <p>Please review their signature and approve the lease:</p>
            <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px;">Review Lease</a>
        `
    }),
    LEASE_APPROVED: (url: string, address: string) => ({
        subject: `Lease Approved: ${address}`,
        html: `
            <h1>Lease Approved!</h1>
            <p>Your lease for <strong>${address}</strong> has been approved by the landlord.</p>
            <p>You can view the final signed document here:</p>
            <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px;">View Lease</a>
        `
    }),
    LEASE_REJECTED: (address: string, reason: string) => ({
        subject: `Lease Application Update: ${address}`,
        html: `
            <h1>Lease Application Rejected</h1>
            <p>Your lease application for <strong>${address}</strong> has been rejected.</p>
            <p><strong>Reason:</strong> ${reason}</p>
        `
    }),
    REVISION_REQUESTED: (url: string, address: string, reason: string) => ({
        subject: `Action Required: Lease Revision for ${address}`,
        html: `
            <h1>Revision Requested</h1>
            <p>The landlord has requested changes to your lease submission for <strong>${address}</strong>.</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p>Please simple updates and sign again:</p>
            <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px;">Update Submission</a>
        `
    })
};
