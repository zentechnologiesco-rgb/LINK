"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  startTransition,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { useQuery } from "convex/react";
import {
  Bath,
  BedDouble,
  MapPin,
  Search,
  Share2,
  Compass,
  User,
  Building2,
  Heart,
  MessageSquare,
  Clapperboard,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@convex/_generated/api";
import { ContactLandlordButton } from "@/features/properties/public/components/ContactLandlordButton";
import { SavePropertyButton } from "@/features/properties/public/components/SavePropertyButton";
import { useUser } from "@/components/providers/UserProvider";
import { UserAvatar } from "@/components/ui/user-avatar";
import { getFirstName } from "@/lib/user-name";

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

function getPriceLabel(property: DiscoverProperty, isMultiUnit: boolean) {
  const minimum = formatCurrency(property.minPriceNad);
  if (isMultiUnit) return `From ${minimum}`;

  if (
    property.maxPriceNad &&
    property.maxPriceNad > property.minPriceNad
  ) {
    return `${minimum} - ${formatCurrency(property.maxPriceNad)}`;
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
    return `${availableCount} avail`;
  }

  return "Shared bath";
}

function AmbientBackdrop() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-white dark:bg-black transition-colors" />
    </>
  );
}

function DiscoverSkeleton() {
  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-white dark:bg-black text-black dark:text-white flex transition-colors">
      <AmbientBackdrop />
      <DiscoverSidebar currentUser={null} />

      <div className="relative w-full h-[100svh] md:ml-[240px] xl:ml-[320px] flex-1">
        {/* Skeleton Top Bar */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top,0px)+1rem)] w-full md:hidden">
          <div className="h-[42px] w-[42px] rounded-full bg-black/10 dark:bg-white/10" />
          <div className="h-8 w-24 rounded-full bg-black/10 dark:bg-white/10" />
          <div className="h-[42px] w-[42px] rounded-full bg-black/10 dark:bg-white/10" />
        </div>

        <div className="relative z-10 flex h-[100svh] w-full items-center justify-center">
          <div className="relative flex h-full w-full flex-row items-end justify-center md:items-center md:py-8">
            <div className="relative h-full w-full overflow-hidden bg-[#e5e5e5] dark:bg-[#111] md:w-auto md:flex-shrink-0 md:aspect-[9/16] md:max-h-[820px] md:rounded-xl md:border md:border-black/10 dark:md:border-white/10">
              <div className="absolute inset-0 animate-pulse bg-neutral-900">
                {/* Mobile Right Action Bar Skeleton */}
                <div className="absolute bottom-[108px] right-2 flex flex-col items-center gap-5 md:hidden">
                  <div className="h-[48px] w-[48px] rounded-full bg-white/10" />
                  <div className="h-[44px] w-[44px] rounded-full bg-white/10" />
                  <div className="h-[44px] w-[44px] rounded-full bg-white/10" />
                  <div className="h-[44px] w-[44px] rounded-full bg-white/10" />
                </div>

                {/* Bottom Content Skeleton */}
                <div className="absolute bottom-4 left-4 right-[72px] flex flex-col items-start gap-1.5 md:bottom-6 md:right-6">
                  <div className="h-8 w-32 rounded-lg bg-white/10 mb-1" />
                  <div className="h-5 w-11/12 rounded bg-white/10" />
                  <div className="h-4 w-9/12 rounded bg-white/10" />
                  <div className="mt-1 flex gap-2">
                    <div className="h-6 w-20 rounded bg-white/10" />
                    <div className="h-6 w-24 rounded bg-white/10" />
                    <div className="h-6 w-16 rounded bg-white/10" />
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Right Action Bar Skeleton */}
            <div className="hidden md:flex ml-4 flex-col items-center gap-6 pb-6 animate-pulse">
              <div className="h-[48px] w-[48px] rounded-full bg-white/10" />
              <div className="h-[44px] w-[44px] rounded-full bg-white/10" />
              <div className="h-[44px] w-[44px] rounded-full bg-white/10" />
              <div className="h-[44px] w-[44px] rounded-full bg-white/10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiscoverTopBar({
  currentUser,
}: {
  currentUser: ReturnType<typeof useUser>["user"];
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top,0px)+1rem)] w-full md:hidden">
      <div className="relative z-10 flex w-[80px]">
        <Link
          href="/"
          aria-label="Search"
          className="pointer-events-auto inline-flex h-[42px] w-[42px] items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md transition hover:bg-black/40 active:scale-[0.96]"
        >
          <Search className="h-5 w-5" strokeWidth={2.5} />
        </Link>
      </div>

      <div className="absolute inset-x-0 top-[calc(env(safe-area-inset-top,0px)+1rem)] flex justify-center text-center font-[family:var(--font-apple-ui)] pointer-events-none mt-2.5">
        <div>
          <p className="text-[1.1rem] font-bold tracking-tight text-white leading-none">
            For You
          </p>
          <div className="mx-auto mt-1.5 flex h-1 w-8 rounded-full bg-white" />
        </div>
      </div>

      <div className="relative z-10 flex w-[80px] justify-end">
        {!currentUser && (
          <Link
            href="/sign-in?redirect=%2Fdiscover"
            className="pointer-events-auto inline-flex h-[36px] items-center justify-center rounded-full bg-white/20 px-4 text-[14px] font-semibold text-white backdrop-blur-md transition hover:bg-white/30 active:scale-[0.96] border border-white/10"
          >
            Log in
          </Link>
        )}
      </div>
    </div>
  );
}

function DiscoverSidebar({
  currentUser,
}: {
  currentUser: ReturnType<typeof useUser>["user"];
}) {
  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-[100svh] w-[240px] xl:w-[320px] bg-white dark:bg-black border-r border-black/5 dark:border-white/10 flex-col z-40 overflow-y-auto no-scrollbar scroll-smooth transition-colors">
      <div className="px-4 py-5 flex items-center gap-2">
        <span className="font-bold text-[32px] tracking-tighter text-black dark:text-white font-[family:var(--font-apple-ui)]">Link<span className="text-[#fe2c55]">.</span></span>
      </div>

      <div className="px-4 mb-6 relative">
        <div className="flex bg-[#f1f1f2] dark:bg-[#2f2f2f] rounded-full h-[44px] items-center px-4 hover:bg-[#e4e4e9] dark:hover:bg-[#3a3a3a] transition cursor-text group border border-transparent focus-within:border-black/20 dark:focus-within:border-white/20">
          <Search className="h-[18px] w-[18px] text-black/40 dark:text-white/50 group-focus-within:text-black dark:group-focus-within:text-white transition" />
          <input 
            type="text" 
            placeholder="Search" 
            className="bg-transparent border-none outline-none text-[15px] ml-2 text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/50 w-full" 
            disabled
          />
        </div>
      </div>

      <nav className="flex flex-col gap-0.5 px-3 mb-6">
        <Link href="/discover" className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition group">
          <Clapperboard className="h-[24px] w-[24px] text-[#fe2c55]" />
          <span className="text-[17px] font-bold text-[#fe2c55]">For You</span>
        </Link>
        <Link href="/" className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition group text-black dark:text-white">
          <Search className="h-[24px] w-[24px]" />
          <span className="text-[17px] font-bold">Explore</span>
        </Link>
        {currentUser?.role === "landlord" ? (
          <Link href="/landlord/properties" className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition group text-black dark:text-white">
            <Building2 className="h-[24px] w-[24px]" />
            <span className="text-[17px] font-bold">My Properties</span>
          </Link>
        ) : (
          <Link href="/tenant/saved" className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition group text-black dark:text-white">
            <Heart className="h-[24px] w-[24px]" />
            <span className="text-[17px] font-bold">Saved</span>
          </Link>
        )}
        <Link href="/chat" className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition group text-black dark:text-white">
          <MessageSquare className="h-[24px] w-[24px]" />
          <span className="text-[17px] font-bold">Messages</span>
        </Link>
        {currentUser && (
          <Link href="/settings" className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition group text-black dark:text-white">
            <User className="h-[24px] w-[24px]" />
            <span className="text-[17px] font-bold">Profile</span>
          </Link>
        )}
      </nav>

      <div className="mt-auto px-4 pb-6">
        {!currentUser ? (
          <>
            <p className="text-[14px] text-black/50 dark:text-white/50 mb-4 px-1 leading-snug">Log in to systematically map your real estate journey.</p>
            <Link href="/sign-in?redirect=%2Fdiscover" className="flex items-center justify-center w-full h-[48px] bg-[#fe2c55] text-white font-bold text-[16px] rounded-[8px] hover:bg-[#ef2b51] transition outline-none">
              Log in
            </Link>
          </>
        ) : (
          <div className="flex items-center gap-3 px-1 pt-4 border-t border-black/10 dark:border-white/10">
            <UserAvatar src={currentUser.avatarUrl} name={currentUser.fullName} className="h-10 w-10 border border-black/10 dark:border-white/20" />
            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-black dark:text-white line-clamp-1">{getFirstName(currentUser, "User")}</span>
              <span className="text-[13px] text-black/50 dark:text-white/50">Online</span>
            </div>
          </div>
        )}
        <div className="mt-6 flex flex-col items-start text-[12px] font-medium text-black/40 dark:text-white/30 space-y-1 px-1">
          <Link href="/terms" className="hover:underline text-black dark:text-white">Terms & Policies</Link>
          <p className="pt-2">© 2026 Link</p>
        </div>
      </div>
    </aside>
  );
}

function DiscoverCardActions({
  property,
  isOwner,
  hostName,
  handleShare,
  isOverlay = true,
}: {
  property: DiscoverProperty;
  isOwner: boolean;
  hostName: string;
  handleShare: () => void;
  isOverlay?: boolean;
}) {
  const textColor = isOverlay ? "text-white/95" : "text-black/80 dark:text-white/95";
  const iconBtnClass = isOverlay 
    ? "!bg-white/10 hover:!bg-white/20 !border-white/20 !text-white" 
    : "!bg-black/5 hover:!bg-black/10 dark:hover:!bg-white/20 !border-black/10 dark:!border-white/20 dark:!bg-white/10 !text-black dark:!text-white";
  const avatarBorder = isOverlay ? "border-[1.5px] border-white shrink-0 bg-white/10" : "border-[1.5px] shrink-0 border-black/10 dark:border-white bg-black/5 dark:bg-white/10";

  return (
    <>
      <div className="relative flex flex-col items-center">
        <Link
          href={`/properties?host=${property.landlordId}`}
          className={`group relative h-[48px] w-[48px] overflow-hidden rounded-full ${avatarBorder}`}
        >
          <UserAvatar
            src={property.landlordInfo?.avatarUrl ?? null}
            name={hostName}
            className="h-full w-full"
          />
        </Link>
      </div>

      <div className="flex flex-col items-center gap-1">
        <SavePropertyButton
          propertyId={property._id}
          landlordId={property.landlordId}
          variant="discover"
          className={`!h-[44px] !w-[44px] backdrop-blur-md transition ${iconBtnClass}`}
        />
        <span className={`text-[12px] font-semibold ${textColor}`}>
          Save
        </span>
      </div>

      {!isOwner ? (
        <div className="flex flex-col items-center gap-1">
          <ContactLandlordButton
            propertyId={property._id}
            landlordId={property.landlordId}
            variant="icon"
            className={`!h-[44px] !w-[44px] !border backdrop-blur-md transition ${iconBtnClass}`}
          />
          <span className={`text-[12px] font-semibold ${textColor}`}>
            Chat
          </span>
        </div>
      ) : null}

      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={handleShare}
          aria-label="Share listing"
          className={`inline-flex h-[44px] w-[44px] items-center justify-center rounded-full border backdrop-blur-md transition active:scale-[0.95] ${iconBtnClass}`}
        >
          <Share2 className="h-[22px] w-[22px]" strokeWidth={2.2} />
        </button>
        <span className={`text-[12px] font-semibold ${textColor}`}>
          Share
        </span>
      </div>
    </>
  );
}

function DiscoverCard({
  property,
  index,
  isActive,
  currentUserId,
  setNode,
}: {
  property: DiscoverProperty;
  index: number;
  isActive: boolean;
  currentUserId?: string;
  setNode: (node: HTMLElement | null) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMultiUnit =
    (property.unitCount ?? 1) > 1 ||
    property.listingType === "multi_unit_block" ||
    property.listingType === "student_accommodation";
  const isOwner = currentUserId === property.landlordId;
  const priceLabel = getPriceLabel(property, isMultiUnit);
  const posterUrl = property.imageUrls?.[0] ?? "/window.svg";
  const detailHref = `/properties/${property._id}?from=discover&index=${index}`;
  const hostName = property.landlordInfo?.name?.trim() || "Verified host";
  const cleanHandle = hostName.replace(/\s+/g, "").toLowerCase() || "verifiedhost";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      void video.play().catch(() => {});
      return;
    }

    video.pause();
  }, [isActive]);

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
      toast.success("Listing link copied.");
    } catch {
      toast.error("Couldn't share this listing right now.");
    }
  };

  return (
    <section
      ref={setNode}
      data-index={index}
      className="relative h-[100svh] min-h-[100svh] w-full snap-start snap-always overflow-hidden flex items-center justify-center bg-white dark:bg-black transition-colors"
    >
      <article className="relative isolate flex h-full w-full flex-row items-end justify-center md:items-center md:py-8 md:max-w-7xl">
        
        {/* Video Frame: This container always remains fully black so video edges aren't white */}
        <div className="relative h-full w-full overflow-hidden bg-black md:w-auto md:flex-shrink-0 md:aspect-[9/16] md:max-h-[820px] md:rounded-xl md:border md:border-black/5 dark:md:border-white/10 shadow-none md:shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:md:shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
          {/* Full Screen Media */}
          <div className="absolute inset-0">
            {property.videoUrl ? (
              <video
                ref={videoRef}
                src={property.videoUrl}
                poster={posterUrl}
                muted
                loop
                playsInline
                preload={isActive ? "auto" : "metadata"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="h-full w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${posterUrl})` }}
              />
            )}

            {/* Gradients tailored for text readability on pure image backgrounds */}
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/50 via-black/10 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
          </div>

          {/* Mobile Right Action Column (Overlay) */}
          <div className="pointer-events-auto absolute bottom-[108px] right-2 z-20 flex flex-col items-center gap-5 md:hidden">
            <DiscoverCardActions 
              property={property}
              isOwner={isOwner}
              hostName={hostName}
              handleShare={handleShare}
              isOverlay={true}
            />
          </div>

          {/* Bottom Metadata Info Area - Real Estate Focus */}
          <Link
            href={detailHref}
            className="pointer-events-auto absolute bottom-4 left-4 right-[72px] z-20 flex flex-col items-start gap-1 md:bottom-6 md:right-6 active:opacity-80 transition"
          >
            {/* Price - Scaled Down */}
            <h2 className="font-[family:var(--font-apple-ui)] text-[24px] font-bold tracking-tight text-white leading-none">
              {priceLabel}
              <span className="text-[13px] font-semibold tracking-normal text-white/90 ml-1">
                /mo
              </span>
            </h2>

            {/* Location & Title */}
            <div className="mt-0.5 flex flex-col gap-0.5 pr-2">
              <h3 className="flex items-center gap-1.5 text-[15px] font-bold leading-[1.3] text-white line-clamp-1">
                <MapPin className="h-4 w-4 text-[#9fe7ff]" strokeWidth={2.5} />
                {property.city}, {property.address}
              </h3>
              <p className="text-[14px] font-medium leading-[1.3] text-white/90 line-clamp-1">
                {property.title}
              </p>
            </div>

            {/* Quick Tags Array */}
            <div className="mt-1 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-md border border-white/20 bg-black/30 px-2 py-0.5 text-[12px] font-semibold text-white backdrop-blur-md">
                <BedDouble className="h-3 w-3" strokeWidth={2.5} />
                {getBedsLabel(property, isMultiUnit)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-white/20 bg-black/30 px-2 py-0.5 text-[12px] font-semibold text-white backdrop-blur-md">
                <Bath className="h-3 w-3" strokeWidth={2.5} />
                {getBathsLabel(property, isMultiUnit)}
              </span>
              <span className="inline-flex items-center rounded-md border border-white/20 bg-black/30 px-2 py-0.5 text-[12px] font-semibold text-white backdrop-blur-md">
                {property.propertyType || "Home"}
              </span>
            </div>

            {/* Host Handle and Description inline */}
            <div className="mt-1.5 flex items-start gap-1 pr-4">
              <span className="font-bold text-[13px] text-white leading-[1.3] whitespace-nowrap">
                @{cleanHandle}
              </span>
              {property.description && (
                <span className="line-clamp-2 text-[13px] text-white/80 leading-[1.3]">
                  {property.description}
                </span>
              )}
            </div>
          </Link>
        </div>

        {/* Desktop Right Action Column (Outside Video Frame) */}
        <div className="hidden md:flex ml-4 flex-col items-center gap-5 self-end pb-8">
          <DiscoverCardActions 
            property={property}
            isOwner={isOwner}
            hostName={hostName}
            handleShare={handleShare}
            isOverlay={false}
          />
        </div>

      </article>
    </section>
  );
}

function DiscoverEmptyState({
  currentUserRole,
}: {
  currentUserRole?: "tenant" | "landlord" | "admin" | null;
}) {
  return (
    <main className="flex h-[100svh] w-full items-center justify-center bg-white dark:bg-black px-4 transition-colors">
      <div className="w-full max-w-[340px] rounded-[2.2rem] border border-black/5 dark:border-white/10 bg-neutral-50 dark:bg-[#111] p-8 text-center shadow-xl dark:shadow-2xl">
        <div className="mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.6rem] border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm">
          <Compass className="h-8 w-8 text-[#fe2c55] dark:text-[#9fe7ff]" strokeWidth={2.1} />
        </div>

        <h1 className="mt-6 font-[family:var(--font-apple-ui)] text-[22px] font-bold leading-[1.2] tracking-tight text-black dark:text-white">
          No clips found
        </h1>

        <p className="mx-auto mt-3 text-[15px] leading-relaxed text-black/50 dark:text-white/50">
          Be the first to see short walkthrough clips right when they drop.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/"
            className="inline-flex h-[52px] items-center justify-center rounded-2xl bg-black dark:bg-white px-5 text-[16px] font-semibold text-white dark:text-black transition active:scale-95"
          >
            Browse homes
          </Link>

          {currentUserRole === "landlord" ? (
            <Link
              href="/landlord/properties"
              className="inline-flex h-[52px] items-center justify-center rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-5 text-[16px] font-semibold text-black dark:text-white transition active:scale-95 hover:bg-black/10 dark:hover:bg-white/10"
            >
              Add a clip
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}

export function DiscoverFeed() {
  const { user: currentUser } = useUser();
  const searchParams = useSearchParams();
  const properties = useQuery(api.properties.listDiscover, { limit: 24 });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const hasRestoredInitialIndex = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const requestedIndex = Number.parseInt(searchParams.get("index") ?? "", 10);
  const initialIndex =
    Number.isInteger(requestedIndex) && requestedIndex >= 0
      ? requestedIndex
      : null;

  const scrollToIndex = (
    nextIndex: number,
    behavior: ScrollBehavior = "smooth",
  ) => {
    cardRefs.current[nextIndex]?.scrollIntoView({
      behavior,
      block: "start",
    });
  };

  const handleArrowNavigation = useEffectEvent((direction: 1 | -1) => {
    if (!properties?.length) return;

    const nextIndex = Math.min(
      properties.length - 1,
      Math.max(0, activeIndex + direction),
    );

    if (nextIndex !== activeIndex) {
      scrollToIndex(nextIndex);
    }
  });

  useEffect(() => {
    if (!properties?.length) return;

    cardRefs.current = cardRefs.current.slice(0, properties.length);
  }, [properties]);

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

    const frameId = window.requestAnimationFrame(() => {
      scrollToIndex(nextIndex, "auto");
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [initialIndex, properties]);

  useEffect(() => {
    const root = scrollContainerRef.current;
    if (!root || !properties?.length) return;

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
        root,
        threshold: [0.55, 0.72, 0.9],
      },
    );

    cardRefs.current.forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [properties]);

  useEffect(() => {
    if (!properties?.length) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

      event.preventDefault();
      handleArrowNavigation(event.key === "ArrowDown" ? 1 : -1);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [properties]);

  if (properties === undefined) {
    return <DiscoverSkeleton />;
  }

  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-white dark:bg-black text-black dark:text-white flex transition-colors">
      <AmbientBackdrop />
      <DiscoverSidebar currentUser={currentUser} />

      {/* Main scrolling container wrapper. On desktop, offset by the sidebar width completely so it centers appropriately. */}
      <div className="relative w-full h-[100svh] md:ml-[240px] xl:ml-[320px] flex-1">
        <DiscoverTopBar currentUser={currentUser} />

        {properties.length === 0 ? (
          <DiscoverEmptyState currentUserRole={currentUser?.role} />
        ) : (
          <main
            ref={scrollContainerRef}
            className="relative h-[100svh] w-full snap-y snap-mandatory overflow-y-auto overscroll-y-contain no-scrollbar scroll-smooth"
          >
            {properties.map((property, index) => (
              <DiscoverCard
                key={property._id}
                property={property}
                index={index}
                isActive={index === activeIndex}
                currentUserId={currentUser?._id}
                setNode={(node) => {
                  cardRefs.current[index] = node;
                }}
              />
            ))}
          </main>
        )}
      </div>
    </div>
  );
}
