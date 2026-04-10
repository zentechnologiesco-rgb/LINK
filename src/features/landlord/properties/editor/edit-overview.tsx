"use client";

import Link from "next/link";
import { Clapperboard, Info, XCircle, type LucideIcon } from "@/components/ui/icons";

import { DISCOVER_EXPERIENCE_ENABLED } from "@/config/features";
import { type PropertyWorkflow } from "@/lib/property-workflow";
import { cn } from "@/lib/utils";

type EditStepLink = {
  id: string;
  label: string;
  href: string;
  index: number;
  icon: LucideIcon;
};

export function PropertyFormRejectedBanner({
  adminNotes,
}: {
  adminNotes?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
      <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
      <div>
        <p className="text-[14px] font-semibold text-red-700">Listing Rejected</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-red-600">
          {adminNotes || "Review the feedback and resubmit."}
        </p>
        <p className="mt-1.5 flex items-center gap-1 text-[12px] text-red-500">
          <Info className="h-3 w-3" />
          Saving will resubmit this listing for review.
        </p>
      </div>
    </div>
  );
}

export function PropertyFormEditOverview({
  workflow,
  hasDiscoveryClip,
  imagesCount,
  unitCount,
  stepLinks,
  activeStep,
  clipHref,
}: {
  workflow: PropertyWorkflow;
  hasDiscoveryClip: boolean;
  imagesCount: number;
  unitCount: number;
  stepLinks: EditStepLink[];
  activeStep: number;
  clipHref: string;
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-neutral-200/80 bg-neutral-50/50">
      <div className="border-b border-neutral-100/60 px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-balance text-[28px] font-semibold tracking-[-0.04em] text-neutral-950">
              Edit Listing
            </h2>
            <p className="mt-1 max-w-[36rem] text-[14px] leading-relaxed text-neutral-500">
              Update media, details, pricing, and availability without reopening
              the entire listing flow.
            </p>
          </div>
          <div
            className={cn(
              "inline-flex items-center rounded-full px-3.5 py-2 text-[12px] font-semibold",
              workflow.badgeClassName,
            )}
          >
            {workflow.label}
          </div>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-neutral-500">
          {workflow.description}
        </p>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-100/60 px-5 py-4">
        {DISCOVER_EXPERIENCE_ENABLED ? (
          <div className="min-w-0 flex-1 rounded-[22px] border border-neutral-200/80 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-neutral-950">
                  Discovery Clip
                </p>
                <p className="mt-1 text-[14px] leading-relaxed text-neutral-500">
                  {hasDiscoveryClip
                    ? workflow.isListed
                      ? "This clip is already visible in Discover while the listing stays live."
                      : "This clip is saved to the listing and will appear in Discover when the property is published again."
                    : "Add one short clip to give this listing a place in Discover. Photos and listing approval stay untouched."}
                </p>
              </div>
              <Link
                href={clipHref}
                className={cn(
                  "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border px-4 text-[13px] font-semibold transition-colors active:scale-[0.98]",
                  hasDiscoveryClip
                    ? "border-neutral-200 bg-white text-neutral-950 hover:bg-neutral-50"
                    : "border-neutral-950 bg-neutral-950 text-white hover:bg-neutral-800",
                )}
              >
                <Clapperboard className="h-4 w-4" strokeWidth={2.1} />
                {hasDiscoveryClip ? "Edit Clip" : "Add Clip"}
              </Link>
            </div>
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-3 sm:w-[220px]">
          <div className="rounded-[22px] border border-neutral-200/80 bg-white p-4">
            <p className="text-[12px] font-semibold text-neutral-400">Photos</p>
            <p className="mt-2 text-[22px] font-semibold tracking-[-0.04em] text-neutral-950 tabular-nums">
              {imagesCount}
            </p>
          </div>
          <div className="rounded-[22px] border border-neutral-200/80 bg-white p-4">
            <p className="text-[12px] font-semibold text-neutral-400">Units</p>
            <p className="mt-2 text-[22px] font-semibold tracking-[-0.04em] text-neutral-950 tabular-nums">
              {unitCount}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-5 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {stepLinks.map((link) => {
          const Icon = link.icon;
          const isActive = activeStep === link.index;

          return (
            <Link
              key={link.id}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-all active:scale-[0.98]",
                isActive
                  ? "border-neutral-950 bg-neutral-950 text-white"
                  : "border-neutral-200/60 bg-white text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950",
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={2.1} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
