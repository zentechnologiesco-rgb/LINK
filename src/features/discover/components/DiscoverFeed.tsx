"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useQuery } from "convex/react";
import {
  ArrowLeft,
  BedDouble,
  Bath,
  ChevronUp,
  MapPin,
  Play,
  Share2,
  Volume2,
  VolumeOff,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@convex/_generated/api";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { useUser } from "@/components/providers/UserProvider";
import { UserAvatar } from "@/components/ui/user-avatar";
import { PROPERTY_TYPE_LABELS } from "@/constants/property";
import { ContactLandlordButton } from "@/features/properties/public/components/ContactLandlordButton";
import { SavePropertyButton } from "@/features/properties/public/components/SavePropertyButton";
import { cn } from "@/lib/utils";
import { BrowserSafeVideo } from "@/components/ui/BrowserSafeVideo";

type DiscoverProperty = {
  _id: string;
  landlordId: string;
  title: string;
  description?: string;
  city: string;
  address: string;
  propertyType: string;
  listingType?: "single_home" | "multi_unit_block" | "student_accommodation";
  minPriceNad: number;
  maxPriceNad?: number;
  bedrooms?: number;
  bathrooms?: number;
  sizeSqm?: number;
  imageUrls?: string[];
  videoUrl: string | null;
  unitCount?: number;
  availableUnitCount?: number;
  unitTypeLabels?: string[];
  landlordInfo?: {
    name?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
  } | null;
};

function formatCurrency(value: number) {
  return `N$${value.toLocaleString()}`;
}

function formatPropertyType(propertyType?: string) {
  if (!propertyType) return "Home";

  return (
    PROPERTY_TYPE_LABELS[propertyType as keyof typeof PROPERTY_TYPE_LABELS] ??
    propertyType
      .replace(/_/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase())
  );
}

function getPriceLabel(property: DiscoverProperty, isMultiUnit: boolean) {
  const minimum = formatCurrency(property.minPriceNad);
  if (isMultiUnit) return `From ${minimum}`;

  if (
    property.maxPriceNad &&
    property.maxPriceNad > property.minPriceNad
  ) {
    return `${minimum} – ${formatCurrency(property.maxPriceNad)}`;
  }

  return minimum;
}

function getBedsLabel(property: DiscoverProperty, isMultiUnit: boolean) {
  if (typeof property.bedrooms === "number" && property.bedrooms > 0) {
    return `${property.bedrooms} bed${property.bedrooms === 1 ? "" : "s"}`;
  }

  if (isMultiUnit) {
    const unitCount = property.unitCount ?? 1;
    return `${unitCount} unit${unitCount === 1 ? "" : "s"}`;
  }

  return "Studio";
}

function getBathsLabel(property: DiscoverProperty, isMultiUnit: boolean) {
  if (typeof property.bathrooms === "number" && property.bathrooms > 0) {
    return `${property.bathrooms} bath${property.bathrooms === 1 ? "" : "s"}`;
  }

  if (isMultiUnit) {
    const availableCount = Math.max(property.availableUnitCount ?? 0, 1);
    return `${availableCount} available`;
  }

  return "Shared bath";
}

function getLocationLabel(property: DiscoverProperty) {
  return [property.address, property.city].filter(Boolean).join(", ");
}

/* ─── Individual slide ────────────────────────────────────── */

function DiscoverSlide({
  property,
  index,
  isActive,
  currentUserId,
  setNode,
  total,
  isMuted,
  onToggleMute,
}: {
  property: DiscoverProperty;
  index: number;
  isActive: boolean;
  currentUserId?: string;
  setNode: (node: HTMLElement | null) => void;
  total: number;
  isMuted: boolean;
  onToggleMute: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const isMultiUnit =
    (property.unitCount ?? 1) > 1 ||
    property.listingType === "multi_unit_block" ||
    property.listingType === "student_accommodation";
  const isOwner = currentUserId === property.landlordId;
  const priceLabel = getPriceLabel(property, isMultiUnit);
  const posterUrl = property.imageUrls?.[0] ?? "/window.svg";
  const detailHref = `/properties/${property._id}?from=discover&index=${index}`;
  const hostName = property.landlordInfo?.name?.trim() || "Verified host";
  const locationLabel = getLocationLabel(property);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !property.videoUrl) return;

    if (isActive) {
      setIsPaused(false);
      void video.play().catch(() => { });
      return;
    }

    video.pause();
    video.currentTime = 0;
  }, [isActive, property.videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
  }, [isMuted]);

  const handleTapVideo = () => {
    const video = videoRef.current;
    if (!video || !property.videoUrl) return;

    if (video.paused) {
      void video.play().catch(() => { });
      setIsPaused(false);
    } else {
      video.pause();
      setIsPaused(true);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/properties/${property._id}`;
    const shareText = `${property.title} in ${property.city} for ${priceLabel} per month`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard.");
    } catch {
      toast.error("Couldn't share this listing right now.");
    }
  };

  return (
    <div
      ref={setNode}
      data-index={index}
      className="discover-slide relative flex items-end"
    >
      {/* Full-screen media background */}
      <div className="absolute inset-0">
        {property.videoUrl ? (
          <BrowserSafeVideo
            ref={videoRef}
            src={property.videoUrl}
            posterSrc={posterUrl}
            posterAlt={property.title}
            muted={isMuted}
            loop
            playsInline
            preload={isActive ? "auto" : "metadata"}
            onClick={handleTapVideo}
            className="h-full w-full object-cover cursor-pointer"
            containerClassName="h-full w-full"
          />
        ) : (
          <div
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${posterUrl})` }}
          />
        )}

        {/* No scrims as requested */}
      </div>

      {/* Paused indicator */}
      {isPaused && property.videoUrl && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer"
          onClick={handleTapVideo}
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
            <Play className="h-10 w-10 text-white ml-1" fill="white" strokeWidth={0} />
          </div>
        </div>
      )}

      {/* Top bar — back + counter + mute */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top,0px)+4.5rem)] drop-shadow-md">
        <Link 
          href="/" 
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-all active:scale-[0.97] lg:hover:bg-black/40"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
        </Link>

        {/* Centered counter */}
        <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none">
          <span className="text-[13px] font-semibold text-white/90 tracking-tight">
            {index + 1} / {total}
          </span>
        </div>

        {property.videoUrl ? (
          <button
            type="button"
            onClick={onToggleMute}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-all active:scale-[0.97] lg:hover:bg-black/40"
          >
            {isMuted ? (
              <VolumeOff className="h-4 w-4" strokeWidth={2} />
            ) : (
              <Volume2 className="h-4 w-4" strokeWidth={2} />
            )}
          </button>
        ) : (
          <div className="h-9 w-9" />
        )}
      </div>

      {/* Right action column — TikTok-style */}
      <div className="absolute right-3 z-20 flex flex-col items-center gap-5 md:right-5" style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 5.5rem)" }}>
        {/* Host avatar */}
        <Link
          href={detailHref}
          className="relative flex flex-col items-center gap-1 drop-shadow-md"
        >
          <UserAvatar
            src={property.landlordInfo?.avatarUrl ?? null}
            name={hostName}
            className="h-12 w-12 ring-2 ring-white shadow-lg"
          />
          <span className="text-[10px] font-semibold text-white truncate max-w-[56px]">
            {hostName.split(" ")[0]}
          </span>
        </Link>

        {/* Save */}
        <div className="flex flex-col items-center gap-1 drop-shadow-md">
          <SavePropertyButton
            propertyId={property._id}
            landlordId={property.landlordId}
            variant="discover"
          />
        </div>

        {/* Message */}
        {!isOwner && (
          <div className="flex flex-col items-center gap-1 drop-shadow-md">
            <ContactLandlordButton
              propertyId={property._id}
              landlordId={property.landlordId}
              variant="icon"
              className="h-12 w-12 rounded-full border border-white/20 bg-black/20 hover:bg-black/30 backdrop-blur-md text-white"
            />
            <span className="text-[10px] font-medium text-white/80">Message</span>
          </div>
        )}

        {/* Share */}
        <button
          type="button"
          onClick={handleShare}
          className="flex flex-col items-center gap-1 drop-shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur-sm transition-all active:scale-90 hover:bg-black/30">
            <Share2 className="h-[22px] w-[22px]" strokeWidth={2} />
          </div>
          <span className="text-[10px] font-medium text-white/80">Share</span>
        </button>
      </div>

      {/* Bottom info panel — Responsive style (TikTok text on mobile, Glassmorphism on desktop) */}
      <div
        className="absolute left-3 z-20 pointer-events-none md:left-5 md:max-w-[17rem]"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 2.5rem)", right: "4.5rem" }}
      >
        <Link href={detailHref} className="block group pointer-events-auto outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl">
          <div className="rounded-2xl bg-transparent md:bg-black/40 backdrop-blur-none md:backdrop-blur-xl border border-transparent md:border-white/20 p-1 md:p-3.5 drop-shadow-md md:drop-shadow-2xl transition-all duration-300 ease-out active:scale-[0.98] lg:hover:scale-[1.02] lg:hover:bg-black/50">
            {/* Header: Badge & Price */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider backdrop-blur-sm">
                {property.videoUrl ? <Play className="h-2.5 w-2.5 fill-current" strokeWidth={0} /> : null}
                {formatPropertyType(property.propertyType)}
              </span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-base font-bold tracking-tight text-white leading-none">{priceLabel}</span>
                <span className="text-[10px] font-medium text-white/70">/mo</span>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-[14px] font-bold tracking-tight text-white leading-snug line-clamp-1 pr-1">
              {property.title}
            </h2>

            {/* Location */}
            <p className="mt-1 flex items-center gap-1 text-[11px] text-white/80 font-medium truncate">
              <MapPin className="h-3 w-3 shrink-0" strokeWidth={2.5} />
              <span className="truncate">{locationLabel}</span>
            </p>

            {/* Specs & View details */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] font-medium text-white/90">
                <span className="flex items-center gap-1">
                  <BedDouble className="h-3.5 w-3.5 text-white/80" strokeWidth={2} />
                  {getBedsLabel(property, isMultiUnit)}
                </span>
                <span className="text-white/30">·</span>
                <span className="flex items-center gap-1">
                  <Bath className="h-3.5 w-3.5 text-white/80" strokeWidth={2} />
                  {getBathsLabel(property, isMultiUnit)}
                </span>
              </div>
              <span className="flex items-center gap-0.5 text-[11px] font-bold text-white group-hover:text-white/80 transition-colors">
                Details <ChevronUp className="h-3.5 w-3.5 rotate-90" strokeWidth={3} />
              </span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

/* ─── Empty state ─────────────────────────────────────────── */

function DiscoverEmptyState({
  currentUser,
}: {
  currentUser: ReturnType<typeof useUser>["user"];
}) {
  return (
    <div className="discover-slide flex items-center justify-center bg-background">
      <div className="w-full max-w-sm px-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          No walkthroughs yet
        </h1>

        <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
          Video tours will appear here as listings are added.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-foreground px-6 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
          >
            Browse homes
          </Link>

          {currentUser?.role === "landlord" && (
            <Link
              href="/landlord/properties"
              className="inline-flex h-12 items-center justify-center rounded-xl text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50"
            >
              Manage listings
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Skeleton ────────────────────────────────────────────── */

function DiscoverSkeleton({
  currentUser,
}: {
  currentUser: ReturnType<typeof useUser>["user"];
}) {
  return (
    <div className="discover-feed-container">
      <Header
        user={currentUser}
        userRole={currentUser?.role}
        isLoading={currentUser === undefined}
      />

      <div className="discover-feed">
        <div className="discover-slide flex items-end bg-neutral-100 dark:bg-neutral-900">
          {/* Shimmer background */}
          <div className="absolute inset-0 animate-pulse bg-neutral-200 dark:bg-neutral-800" />

          {/* Right column skeleton */}
          <div className="absolute right-4 flex flex-col items-center gap-5" style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 5.5rem)" }}>
            <div className="h-12 w-12 animate-pulse rounded-full bg-white/20" />
            <div className="h-12 w-12 animate-pulse rounded-full bg-white/20" />
            <div className="h-12 w-12 animate-pulse rounded-full bg-white/20" />
          </div>

          {/* Bottom info skeleton */}
          <div
            className="absolute left-3 z-20 md:left-5 md:max-w-[17rem] rounded-2xl bg-transparent md:bg-black/20 border border-transparent md:border-white/10 p-1 md:p-3.5"
            style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 2.5rem)", right: "4.5rem" }}
          >
            <div className="flex justify-between mb-3">
              <div className="h-4 w-14 animate-pulse rounded-md bg-white/10" />
              <div className="h-4 w-20 animate-pulse rounded-md bg-white/10" />
            </div>
            <div className="h-3.5 w-3/4 animate-pulse rounded bg-white/10 mb-2" />
            <div className="h-2.5 w-1/2 animate-pulse rounded bg-white/10 mb-3" />
            <div className="flex gap-3">
              <div className="h-2.5 w-14 animate-pulse rounded bg-white/10" />
              <div className="h-2.5 w-14 animate-pulse rounded bg-white/10" />
            </div>
          </div>
        </div>
      </div>

      <MobileNav user={currentUser} userRole={currentUser?.role} />
    </div>
  );
}

/* ─── Swipe hint ──────────────────────────────────────────── */

function SwipeHint({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+7.5rem)] z-30 flex justify-center pointer-events-none animate-fade-in">
      <div className="flex flex-col items-center gap-1.5 animate-bounce">
        <ChevronUp className="h-5 w-5 text-white/60" strokeWidth={2.5} />
        <span className="text-[11px] font-semibold text-white/50 tracking-wide uppercase">
          Swipe up
        </span>
      </div>
    </div>
  );
}

/* ─── Main feed ───────────────────────────────────────────── */

export function DiscoverFeed() {
  const { user: currentUser } = useUser();
  const searchParams = useSearchParams();
  const properties = useQuery(api.properties.listDiscover, { limit: 24 });
  const slideRefs = useRef<Array<HTMLElement | null>>([]);
  const feedRef = useRef<HTMLDivElement>(null);
  const hasRestoredInitialIndex = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showSwipeHint, setShowSwipeHint] = useState(true);

  const requestedIndex = Number.parseInt(searchParams.get("index") ?? "", 10);
  const initialIndex =
    Number.isInteger(requestedIndex) && requestedIndex >= 0
      ? requestedIndex
      : null;

  const scrollToIndex = useCallback(
    (nextIndex: number, behavior: ScrollBehavior = "smooth") => {
      slideRefs.current[nextIndex]?.scrollIntoView({
        behavior,
        block: "start",
      });
    },
    [],
  );

  const handleNavigate = useCallback(
    (direction: 1 | -1) => {
      if (!properties?.length) return;

      const nextIndex = Math.min(
        properties.length - 1,
        Math.max(0, activeIndex + direction),
      );

      if (nextIndex !== activeIndex) {
        scrollToIndex(nextIndex);
      }
    },
    [properties, activeIndex, scrollToIndex],
  );

  // Sync refs array length
  useEffect(() => {
    if (!properties?.length) return;
    slideRefs.current = slideRefs.current.slice(0, properties.length);
  }, [properties]);

  // Restore initial index from URL
  useEffect(() => {
    if (
      !properties?.length ||
      initialIndex === null ||
      hasRestoredInitialIndex.current
    ) {
      return;
    }

    const nextIndex = Math.min(properties.length - 1, initialIndex);
    hasRestoredInitialIndex.current = true;
    startTransition(() => setActiveIndex(nextIndex));

    const timeoutId = window.setTimeout(() => {
      scrollToIndex(nextIndex, "auto");
    }, 60);

    return () => window.clearTimeout(timeoutId);
  }, [initialIndex, properties, scrollToIndex]);

  // IntersectionObserver for active slide detection
  useEffect(() => {
    if (!properties?.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (left, right) => right.intersectionRatio - left.intersectionRatio,
          )[0];

        if (!visibleEntry) return;

        const nextIndex = Number(
          (visibleEntry.target as HTMLElement).dataset.index,
        );

        if (!Number.isNaN(nextIndex)) {
          startTransition(() => setActiveIndex(nextIndex));
        }
      },
      {
        threshold: [0.5, 0.75],
        root: feedRef.current,
      },
    );

    slideRefs.current.forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [properties]);

  // Keyboard navigation
  useEffect(() => {
    if (!properties?.length) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

      event.preventDefault();
      handleNavigate(event.key === "ArrowDown" ? 1 : -1);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [properties, handleNavigate]);

  // Hide swipe hint after first scroll
  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;

    const handleScroll = () => {
      if (feed.scrollTop > 50) {
        setShowSwipeHint(false);
      }
    };

    feed.addEventListener("scroll", handleScroll, { passive: true });
    return () => feed.removeEventListener("scroll", handleScroll);
  }, []);

  // Also dismiss hint after a few seconds
  useEffect(() => {
    const timeout = window.setTimeout(() => setShowSwipeHint(false), 5000);
    return () => window.clearTimeout(timeout);
  }, []);

  if (properties === undefined) {
    return <DiscoverSkeleton currentUser={currentUser} />;
  }

  if (properties.length === 0) {
    return (
      <div className="discover-feed-container">
        <Header
          user={currentUser}
          userRole={currentUser?.role}
          isLoading={currentUser === undefined}
        />
        <div className="discover-feed">
          <DiscoverEmptyState currentUser={currentUser} />
        </div>
        <MobileNav user={currentUser} userRole={currentUser?.role} />
      </div>
    );
  }

  return (
    <div className="discover-feed-container">
      <Header
        user={currentUser}
        userRole={currentUser?.role}
        isLoading={currentUser === undefined}
      />

      <div ref={feedRef} className="discover-feed">
        {properties.map((property, index) => (
          <DiscoverSlide
            key={property._id}
            property={property}
            index={index}
            isActive={index === activeIndex}
            currentUserId={currentUser?._id}
            setNode={(node) => {
              slideRefs.current[index] = node;
            }}
            total={properties.length}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted((m) => !m)}
          />
        ))}

        {/* Swipe hint on first slide */}
        {activeIndex === 0 && properties.length > 1 && (
          <SwipeHint visible={showSwipeHint} />
        )}
      </div>

      <MobileNav user={currentUser} userRole={currentUser?.role} />
    </div>
  );
}
