"use client"

import Link from "next/link"
import { Edit } from "lucide-react"

import { ContactLandlordButton } from "@/features/properties/public/components/ContactLandlordButton"
import { SavePropertyButton } from "@/features/properties/public/components/SavePropertyButton"
import { useUser } from "@/components/providers/UserProvider"
import { getAvailableInventoryCount, getPriceHeading, getPropertyEditHref } from "./shared"
import type { PropertyDetailData } from "./types"

function usePropertyActions(property: PropertyDetailData) {
    const { user } = useUser()
    const isOwner = Boolean(user && user._id === property.landlordId)
    const availableInventoryCount = getAvailableInventoryCount(property)

    return {
        isOwner,
        canContactLandlord: !isOwner && availableInventoryCount > 0,
        priceHeading: getPriceHeading(property),
        editHref: getPropertyEditHref(property.id),
    }
}

export function PropertyDetailMobileActionBar({ property }: { property: PropertyDetailData }) {
    const { isOwner, canContactLandlord, priceHeading, editHref } = usePropertyActions(property)

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t border-neutral-200/60 bg-white/80 px-5 py-3 backdrop-blur-2xl safe-area-bottom">
            {isOwner ? (
                <div className="w-full">
                    <Link
                        href={editHref}
                        className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[14px] bg-neutral-900 text-[15px] font-[800] text-white transition-all active:scale-[0.97] hover:bg-black"
                    >
                        <Edit className="h-[18px] w-[18px]" /> Edit Listing
                    </Link>
                </div>
            ) : (
                <>
                    <div className="flex flex-col justify-center">
                        <div className="flex items-baseline gap-1">
                            <span className="text-[20px] font-[900] leading-none tracking-[-0.02em] text-neutral-900">
                                {priceHeading}
                            </span>
                        </div>
                        <span className="mt-0.5 text-[13px] font-semibold text-neutral-400">/month</span>
                    </div>
                    {canContactLandlord ? (
                        <ContactLandlordButton
                            propertyId={property.id}
                            landlordId={property.landlordId}
                            variant="mobile"
                            className="h-[50px] rounded-[14px] border-0 bg-neutral-900 px-7 text-[15px] font-[800] text-white shadow-none transition-all active:scale-[0.97] hover:bg-black"
                        />
                    ) : (
                        <div className="flex h-[50px] items-center justify-center rounded-[14px] bg-neutral-100 px-5 text-[14px] font-[800] text-neutral-500">
                            Currently unavailable
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export function PropertyDetailDesktopSidebar({ property }: { property: PropertyDetailData }) {
    const { isOwner, canContactLandlord, priceHeading, editHref } = usePropertyActions(property)

    return (
        <div className="sticky top-24 rounded-[24px] border border-neutral-200 bg-white p-6 shadow-[0_8px_28px_rgba(0,0,0,0.06)]">
            <div className="mb-6 flex items-baseline gap-1.5">
                <span className="text-[26px] font-[900] tracking-[-0.03em] text-neutral-900">{priceHeading}</span>
                <span className="ml-0.5 text-[15px] font-semibold text-neutral-400">/ month</span>
            </div>

            <div className="space-y-3">
                {isOwner ? (
                    <div className="space-y-3">
                        <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
                            <h3 className="mb-0.5 text-[14px] font-[800]">You own this listing</h3>
                            <p className="text-[13px] font-medium text-neutral-500">Manage your details and pricing.</p>
                        </div>
                        <Link
                            href={editHref}
                            className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[14px] bg-neutral-900 text-[15px] font-[800] text-white transition-all active:scale-[0.98] hover:bg-black"
                        >
                            <Edit className="h-[18px] w-[18px]" /> Edit Listing
                        </Link>
                    </div>
                ) : (
                    <>
                        {canContactLandlord ? (
                            <ContactLandlordButton
                                propertyId={property.id}
                                landlordId={property.landlordId}
                                className="h-[50px] w-full rounded-[14px] border-0 bg-neutral-900 text-[15px] font-[800] text-white transition-all active:scale-[0.98] hover:bg-black"
                            />
                        ) : (
                            <div className="flex h-[50px] items-center justify-center rounded-[14px] bg-neutral-100 text-[15px] font-[800] text-neutral-500">
                                Currently unavailable
                            </div>
                        )}
                        <SavePropertyButton
                            variant="default"
                            propertyId={property.id}
                            landlordId={property.landlordId}
                            className="h-[50px] w-full rounded-[14px] border border-neutral-200 bg-white text-[15px] font-[700] text-neutral-900 shadow-none transition-all hover:border-neutral-300 hover:bg-neutral-50"
                        />
                    </>
                )}
            </div>

            {!isOwner && (
                <div className="flex justify-center pt-5">
                    <span className="text-[13px] font-medium text-neutral-400">You won&apos;t be charged yet</span>
                </div>
            )}
        </div>
    )
}
