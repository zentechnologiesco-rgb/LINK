import { DISCOVER_EXPERIENCE_ENABLED } from "@/config/features"

const DIGITS_ONLY_PATTERN = /^\d+$/

export interface SearchParamReader {
    get(name: string): string | null
}

export function getPropertyDetailBackState(searchParams: SearchParamReader) {
    const isFromDiscover =
        DISCOVER_EXPERIENCE_ENABLED && searchParams.get("from") === "discover"
    const discoverIndexParam = searchParams.get("index")
    const discoverIndex =
        discoverIndexParam && DIGITS_ONLY_PATTERN.test(discoverIndexParam) ? discoverIndexParam : null

    return {
        backHref: isFromDiscover ? `/discover${discoverIndex ? `?index=${discoverIndex}` : ""}` : "/",
        backLabel: isFromDiscover ? "Back to Discover" : "Back to Home",
    }
}
