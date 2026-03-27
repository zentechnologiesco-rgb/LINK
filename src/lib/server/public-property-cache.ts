import { unstable_cache } from "next/cache"
import { fetchQuery } from "convex/nextjs"

import { api } from "../../../convex/_generated/api"
import { type Id } from "../../../convex/_generated/dataModel"

export const getCachedPublicPropertyById = unstable_cache(
    async (propertyId: string) =>
        fetchQuery(api.properties.getById, {
            propertyId: propertyId as Id<"properties">,
        }),
    ["public-property-by-id"],
    {
        revalidate: 60,
    }
)
