"use client";

import { Camera, X } from "lucide-react";

import type { Id } from "@convex/_generated/dataModel";
import { type PropertyWorkflow } from "@/lib/property-workflow";
import { cn } from "@/lib/utils";

import { PropertyClipUpload } from "../components/PropertyClipUpload";
import { PropertyImageUpload } from "../components/PropertyImageUpload";
import { CardSection } from "./components";

export function MediaStepSection({
  mode,
  initialImages,
  initialVideos,
  hasDiscoveryClip,
  highlighted,
  imagesCount,
  videosCount,
  workflow,
  onDismissHighlight,
  onImagesChange,
  onVideosChange,
}: {
  mode: "create" | "edit";
  initialImages: Id<"_storage">[];
  initialVideos: Id<"_storage">[];
  hasDiscoveryClip: boolean;
  highlighted: boolean;
  imagesCount: number;
  videosCount: number;
  workflow: PropertyWorkflow | null;
  onDismissHighlight: () => void;
  onImagesChange: (images: Id<"_storage">[]) => void;
  onVideosChange: (videos: Id<"_storage">[]) => void;
}) {
  return (
    <div className="space-y-4">
      {mode === "edit" ? (
        <div
          className={cn(
            "rounded-[24px] border px-4 py-4 transition-colors",
            highlighted
              ? "border-neutral-900 bg-white"
              : "border-neutral-200 bg-[#f5f5f7]",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-neutral-950">
                Discovery Clip
              </p>
              <p className="mt-1 text-[16px] font-semibold tracking-[-0.03em] text-neutral-950">
                {hasDiscoveryClip
                  ? "Replace the clip or leave it as it is"
                  : "Add a clip whenever you are ready"}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-neutral-500">
                Add or replace the Discover clip here. The rest of the listing
                stays unchanged unless you edit those fields too.
              </p>
            </div>
            {highlighted ? (
              <button
                type="button"
                onClick={onDismissHighlight}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-900 active:scale-90"
                aria-label="Dismiss clip spotlight"
              >
                <X className="h-4 w-4" strokeWidth={2.4} />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <CardSection className="p-4">
        <PropertyClipUpload
          initialVideos={initialVideos}
          onVideosChange={onVideosChange}
          highlighted={highlighted}
          title="Discovery Clip"
          description={
            mode === "edit"
              ? "Add or replace one short vertical clip for Discover. Saving here does not change the rest of the listing unless you edit those fields too."
              : "Optional. Add one short vertical clip to help this listing appear in the Discover feed."
          }
          badgeLabel={
            hasDiscoveryClip
              ? workflow?.isListed
                ? "Visible"
                : "Saved"
              : "Optional"
          }
        />
      </CardSection>

      <CardSection className="p-4">
        <PropertyImageUpload
          maxImages={15}
          onImagesChange={onImagesChange}
          initialImages={initialImages}
        />
      </CardSection>

      {imagesCount === 0 ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4">
          <Camera className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
          <p className="text-[14px] leading-relaxed text-amber-800">
            At least one photo is required before you can publish.
          </p>
        </div>
      ) : null}

      {imagesCount > 0 ? (
        <div className="space-y-2 px-1">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <p className="text-[13px] text-neutral-500">
              {imagesCount} photo{imagesCount !== 1 ? "s" : ""} added
              {imagesCount < 5 ? " · Add more for a richer listing" : ""}
            </p>
          </div>
          {videosCount > 0 ? (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-neutral-900" />
              <p className="text-[13px] text-neutral-500">
                Discovery clip ready. It will show in Discover whenever this
                listing is approved and live.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
              <p className="text-[13px] text-neutral-500">
                Optional: add one short clip to help this listing show up in
                Discover.
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
