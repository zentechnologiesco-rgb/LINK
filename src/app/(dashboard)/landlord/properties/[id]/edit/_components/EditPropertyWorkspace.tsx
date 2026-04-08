'use client'

import { notFound, redirect, useSearchParams } from 'next/navigation'
import { useQuery } from 'convex/react'

import { api } from '@convex/_generated/api'
import { type Id } from '@convex/_generated/dataModel'
import { useUser } from '@/components/providers/UserProvider'
import { PropertyEditor } from '@/features/landlord/properties/editor/PropertyEditor'
import { ClipManager } from '@/features/landlord/properties/components/ClipManager'
import {
  getInitialEditFocus,
  getInitialEditStep,
  toPropertyFormInitialData,
} from '../_lib/edit-property-page-helpers'

import { PropertyEditorLoadingState } from '../../../_components/PropertyEditorLoadingState'

export function EditPropertyWorkspace({ id }: { id: string }) {
    const { user: currentUser, isLoading } = useUser()
    const searchParams = useSearchParams()
    const property = useQuery(api.properties.getById, {
        propertyId: id as Id<'properties'>,
    })
    const initialStep = getInitialEditStep(searchParams.get('step'))
    const initialFocus = getInitialEditFocus(searchParams.get('focus'))
    const isClipMode = initialFocus === 'clip'

    if (isLoading || property === undefined) {
        return <PropertyEditorLoadingState />
    }

    if (!currentUser) {
        redirect('/sign-in')
        return null
    }

    if (currentUser.role !== 'landlord' && currentUser.role !== 'admin') {
        redirect('/')
        return null
    }

    if (!property) {
        notFound()
    }

    if (property.landlordId !== currentUser._id && currentUser.role !== 'admin') {
        redirect('/')
        return null
    }

    // ── Focused clip manager ───────────────────────────────────
    if (isClipMode) {
        return (
            <ClipManager
                propertyId={property._id as Id<'properties'>}
                propertyTitle={property.title}
                initialVideos={(property.videos ?? []) as Id<'_storage'>[]}
            />
        )
    }

    // ── Full property editor ───────────────────────────────────
    return (
        <PropertyEditor
            mode="edit"
            propertyId={property._id}
            initialData={toPropertyFormInitialData(property)}
            initialStep={initialStep}
            initialFocus={initialFocus}
        />
    )
}
