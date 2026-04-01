"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Clapperboard, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { cn } from "@/lib/utils";

const MAX_VIDEO_SIZE_MB = 10;
const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

interface PropertyClipUploadProps {
  initialVideos?: Id<"_storage">[];
  onVideosChange: (storageIds: Id<"_storage">[]) => void;
  highlighted?: boolean;
  title?: string;
  description?: string;
  badgeLabel?: string;
}

export function PropertyClipUpload({
  initialVideos = [],
  onVideosChange,
  highlighted = false,
  title = "Discovery Clip",
  description = "Optional. Add one short vertical clip to help this listing appear in the Discover feed once the property is live.",
  badgeLabel = "Optional",
}: PropertyClipUploadProps) {
  const [videoIds, setVideoIds] = useState<Id<"_storage">[]>(initialVideos);
  const [isUploading, setIsUploading] = useState(false);
  const [currentFileName, setCurrentFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const registerUpload = useMutation(api.files.registerUpload);
  const videoUrls = useQuery(api.files.getUrls, { storageIds: videoIds });

  const currentVideoId = videoIds[0];
  const currentVideoUrl = videoUrls?.find((item) => item.id === currentVideoId)?.url ?? null;

  const handleVideoSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_VIDEO_TYPES.has(file.type)) {
      toast.error("Upload an MP4, WebM, or MOV clip.");
      return;
    }

    if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      toast.error(`Clip is too large. Keep it under ${MAX_VIDEO_SIZE_MB}MB.`);
      return;
    }

    setIsUploading(true);
    setCurrentFileName(file.name);

    try {
      const uploadUrl = await generateUploadUrl({
        contentType: file.type,
        fileSize: file.size,
      });

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await response.json();
      const nextId = storageId as Id<"_storage">;
      await registerUpload({ storageId: nextId });

      const nextVideos = [nextId];
      setVideoIds(nextVideos);
      onVideosChange(nextVideos);
      toast.success(
        "Discovery clip uploaded. It will show in Discover whenever the listing is live.",
      );
    } catch (error) {
      console.error("Failed to upload discovery clip", error);
      toast.error("Failed to upload discovery clip.");
    } finally {
      setIsUploading(false);
      setCurrentFileName("");
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleRemoveVideo = async () => {
    if (!currentVideoId) return;

    setVideoIds([]);
    onVideosChange([]);
    toast.success("Discovery clip removed.");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[16px] font-semibold tracking-[-0.02em] text-neutral-950">
            {title}
          </p>
          <p className="mt-1 max-w-[32rem] text-[13px] leading-relaxed text-neutral-500">
            {description}
          </p>
        </div>
        <div className="rounded-full border border-neutral-200 bg-[#f5f5f7] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-600">
          {badgeLabel}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        onChange={handleVideoSelect}
        className="hidden"
        disabled={isUploading}
      />

      {currentVideoUrl ? (
        <div
          className={cn(
            "overflow-hidden rounded-[24px] border bg-white",
            highlighted ? "border-neutral-900" : "border-neutral-200",
          )}
        >
          <div className="relative aspect-[9/16] w-full overflow-hidden bg-black sm:max-h-[28rem]">
            <video
              key={currentVideoUrl}
              src={currentVideoUrl}
              controls
              muted
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
              <div className="rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-950 backdrop-blur-md">
                Visible In Discover
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-neutral-200 bg-white px-4 py-4 text-neutral-950">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-neutral-950 px-4 text-[14px] font-semibold text-white transition-colors hover:bg-neutral-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Upload className="h-4 w-4" strokeWidth={2.3} />
              Replace Clip
            </button>
            <button
              type="button"
              onClick={handleRemoveVideo}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-neutral-200 px-4 text-[14px] font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 active:scale-[0.98]"
            >
              <X className="h-4 w-4" strokeWidth={2.3} />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className={cn(
            "w-full rounded-[24px] border border-dashed px-5 py-10 text-left transition-all",
            isUploading
              ? "cursor-not-allowed border-neutral-300 bg-[#f5f5f7] opacity-80"
              : highlighted
                ? "border-neutral-900 bg-white hover:border-neutral-950"
                : "border-neutral-300 bg-[#f5f5f7] hover:border-neutral-400 hover:bg-white",
          )}
        >
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-900">
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Clapperboard className="h-5 w-5" strokeWidth={2.2} />
              )}
            </div>
            <p className="mt-4 text-[16px] font-semibold tracking-[-0.02em] text-neutral-950">
              {isUploading ? "Uploading clip…" : "Upload a Discovery Clip"}
            </p>
            <p className="mt-2 max-w-[26rem] text-[13px] leading-relaxed text-neutral-500">
              {isUploading
                ? currentFileName || "Finishing upload…"
                : "Best results: 9:16 vertical, under 30 seconds, clear walkthrough, and good lighting."}
            </p>
            <div className="mt-4 inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              MP4, WebM, or MOV up to 10MB
            </div>
          </div>
        </button>
      )}
    </div>
  );
}
