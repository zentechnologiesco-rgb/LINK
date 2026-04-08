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
  mode?: "create" | "edit";
  title?: string;
  description?: string;
  badgeLabel?: string;
}

export function PropertyClipUpload({
  initialVideos = [],
  onVideosChange,
  highlighted = false,
  mode = "create",
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
  const isEdit = mode === "edit";

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
          <p
            className={cn(
              "text-[16px] font-semibold tracking-[-0.02em]",
              isEdit ? "text-neutral-950" : "text-foreground",
            )}
          >
            {title}
          </p>
          <p
            className={cn(
              "mt-1 max-w-[32rem] text-[13px] leading-relaxed",
              isEdit ? "text-neutral-500" : "text-white/50",
            )}
          >
            {description}
          </p>
        </div>
        <div
          className={cn(
            "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
            isEdit
              ? "border-neutral-200/60 bg-neutral-100 text-neutral-500"
              : "border-white/5 bg-surface-2 text-white/60",
          )}
        >
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
            "overflow-hidden rounded-[24px] border",
            highlighted
              ? isEdit
                ? "border-neutral-300"
                : "border-white/20"
              : isEdit
                ? "border-neutral-200/80"
                : "border-white/5",
            isEdit ? "bg-neutral-50/50" : "bg-surface-1",
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
              <div className="rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md">
                Visible In Discover
              </div>
            </div>
          </div>

          <div
            className={cn(
              "flex flex-wrap items-center gap-3 border-t px-4 py-4",
              isEdit
                ? "border-neutral-100/60 bg-white text-neutral-950"
                : "border-white/5 bg-surface-1 text-foreground",
            )}
          >
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className={cn(
                "inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-[14px] font-semibold transition-colors active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70",
                isEdit
                  ? "bg-neutral-950 text-white hover:bg-neutral-800"
                  : "bg-foreground text-background hover:opacity-90",
              )}
            >
              <Upload className="h-4 w-4" strokeWidth={2.3} />
              Replace Clip
            </button>
            <button
              type="button"
              onClick={handleRemoveVideo}
              className={cn(
                "inline-flex h-11 items-center justify-center gap-2 rounded-full border px-4 text-[14px] font-semibold transition-colors active:scale-[0.98]",
                isEdit
                  ? "border-neutral-200/80 text-neutral-600 hover:bg-neutral-50"
                  : "border-white/10 text-white/70 hover:bg-surface-3",
              )}
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
              ? isEdit
                ? "cursor-not-allowed border-neutral-200 bg-neutral-100 opacity-80"
                : "cursor-not-allowed border-white/5 bg-surface-2 opacity-80"
              : highlighted
                ? isEdit
                  ? "border-neutral-300 bg-neutral-100 hover:border-neutral-400"
                  : "border-white/20 bg-surface-1 hover:border-white/30"
                : isEdit
                  ? "border-neutral-200 bg-neutral-50 hover:border-neutral-300 hover:bg-neutral-100"
                  : "border-white/10 bg-surface-1 hover:border-white/20 hover:bg-surface-2",
          )}
        >
            <div className="flex flex-col items-center text-center">
            <div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full border",
                isEdit
                  ? "border-neutral-200/60 bg-white text-neutral-400"
                  : "border-white/5 bg-surface-2 text-foreground",
              )}
            >
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Clapperboard className="h-5 w-5" strokeWidth={2.2} />
              )}
            </div>
            <p
              className={cn(
                "mt-4 text-[16px] font-semibold tracking-[-0.02em]",
                isEdit ? "text-neutral-950" : "text-foreground",
              )}
            >
              {isUploading ? "Uploading clip…" : "Upload a Discovery Clip"}
            </p>
            <p
              className={cn(
                "mt-2 max-w-[26rem] text-[13px] leading-relaxed",
                isEdit ? "text-neutral-500" : "text-white/50",
              )}
            >
              {isUploading
                ? currentFileName || "Finishing upload…"
                : "Best results: 9:16 vertical, under 30 seconds, clear walkthrough, and good lighting."}
            </p>
            <div
              className={cn(
                "mt-4 inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]",
                isEdit
                  ? "border-neutral-200/60 bg-white text-neutral-400"
                  : "border-white/5 bg-surface-2 text-white/50",
              )}
            >
              MP4, WebM, or MOV up to 10MB
            </div>
          </div>
        </button>
      )}
    </div>
  );
}
