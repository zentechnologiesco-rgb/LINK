export type PropertyWorkflowGroup =
  | "live"
  | "review"
  | "changes"
  | "reserved"
  | "leased"
  | "off_market";

export type PropertyWorkflowKey =
  | "draft"
  | "in_review"
  | "changes_requested"
  | "live"
  | "reserved"
  | "leased"
  | "off_market"
  | "no_vacancies";

export type PropertyWorkflowInput = {
  approvalStatus?: string | null;
  publicationStatus?: string | null;
  availableUnitCount?: number | null;
  isAvailable?: boolean | null;
  activeLeaseCount?: number;
  reservedLeaseCount?: number;
};

export type PropertyWorkflow = {
  key: PropertyWorkflowKey;
  group: PropertyWorkflowGroup;
  label: string;
  description: string;
  badgeClassName: string;
  availableUnits: number;
  isListed: boolean;
  hasBlockingLease: boolean;
  canPublish: boolean;
  canUnpublish: boolean;
  canAssignTenant: boolean;
  needsAttention: boolean;
};

function buildWorkflow(
  key: PropertyWorkflowKey,
  input: Pick<
    PropertyWorkflow,
    "group" | "label" | "description" | "badgeClassName"
  >,
  details: Pick<
    PropertyWorkflow,
    | "availableUnits"
    | "isListed"
    | "hasBlockingLease"
    | "canPublish"
    | "canUnpublish"
    | "canAssignTenant"
    | "needsAttention"
  >,
): PropertyWorkflow {
  return {
    key,
    ...input,
    ...details,
  };
}

export function getPropertyWorkflow(
  input: PropertyWorkflowInput,
): PropertyWorkflow {
  const approvalStatus = input.approvalStatus ?? null;
  const isListed = input.publicationStatus === "published";
  const availableUnits =
    input.availableUnitCount ?? (input.isAvailable ? 1 : 0);
  const activeLeaseCount = input.activeLeaseCount ?? 0;
  const reservedLeaseCount = input.reservedLeaseCount ?? 0;
  const hasBlockingLease = activeLeaseCount > 0 || reservedLeaseCount > 0;
  const isApproved = approvalStatus === "approved";
  const canPublish = isApproved && !isListed && availableUnits > 0 && !hasBlockingLease;
  const canUnpublish = isApproved && isListed && !hasBlockingLease;
  const canAssignTenant = isApproved && availableUnits > 0 && !hasBlockingLease;

  if (approvalStatus === "rejected") {
    return buildWorkflow(
      "changes_requested",
      {
        group: "changes",
        label: "Needs Changes",
        description: "Admin sent this back. Update the listing and resubmit it.",
        badgeClassName: "bg-red-500 text-white",
      },
      {
        availableUnits,
        isListed,
        hasBlockingLease,
        canPublish: false,
        canUnpublish: false,
        canAssignTenant: false,
        needsAttention: true,
      },
    );
  }

  if (approvalStatus === "pending") {
    return buildWorkflow(
      "in_review",
      {
        group: "review",
        label: "In Review",
        description: "Admin is reviewing the latest version of this listing.",
        badgeClassName: "bg-amber-400 text-neutral-900",
      },
      {
        availableUnits,
        isListed,
        hasBlockingLease,
        canPublish: false,
        canUnpublish: false,
        canAssignTenant: false,
        needsAttention: false,
      },
    );
  }

  if (activeLeaseCount > 0) {
    return buildWorkflow(
      "leased",
      {
        group: "leased",
        label: "Leased",
        description: "An approved lease is active on this property.",
        badgeClassName: "bg-neutral-900 text-white",
      },
      {
        availableUnits,
        isListed,
        hasBlockingLease,
        canPublish: false,
        canUnpublish: false,
        canAssignTenant: false,
        needsAttention: false,
      },
    );
  }

  if (reservedLeaseCount > 0) {
    return buildWorkflow(
      "reserved",
      {
        group: "reserved",
        label: "Reserved",
        description: "A lease is already in progress, so this listing is blocked.",
        badgeClassName: "bg-amber-500 text-white",
      },
      {
        availableUnits,
        isListed,
        hasBlockingLease,
        canPublish: false,
        canUnpublish: false,
        canAssignTenant: false,
        needsAttention: false,
      },
    );
  }

  if (isApproved && isListed && availableUnits > 0) {
    return buildWorkflow(
      "live",
      {
        group: "live",
        label: "Live",
        description: "Renters can see and apply for this listing right now.",
        badgeClassName: "bg-emerald-500 text-white",
      },
      {
        availableUnits,
        isListed,
        hasBlockingLease,
        canPublish,
        canUnpublish,
        canAssignTenant,
        needsAttention: false,
      },
    );
  }

  if (isApproved && isListed) {
    return buildWorkflow(
      "no_vacancies",
      {
        group: "off_market",
        label: "No Vacancies",
        description: "The listing is published, but there are no vacant public units yet.",
        badgeClassName: "bg-slate-700 text-white",
      },
      {
        availableUnits,
        isListed,
        hasBlockingLease,
        canPublish: false,
        canUnpublish,
        canAssignTenant: false,
        needsAttention: false,
      },
    );
  }

  if (isApproved) {
    return buildWorkflow(
      "off_market",
      {
        group: "off_market",
        label: "Off Market",
        description: "Approved and ready, but hidden until you publish it again.",
        badgeClassName: "bg-neutral-200 text-neutral-700",
      },
      {
        availableUnits,
        isListed,
        hasBlockingLease,
        canPublish,
        canUnpublish,
        canAssignTenant,
        needsAttention: false,
      },
    );
  }

  return buildWorkflow(
    "draft",
    {
      group: "off_market",
      label: "Draft",
      description: "Finish the listing details before sending it through review.",
      badgeClassName: "bg-neutral-200 text-neutral-700",
    },
    {
      availableUnits,
      isListed,
      hasBlockingLease,
      canPublish: false,
      canUnpublish: false,
      canAssignTenant: false,
      needsAttention: false,
    },
  );
}
