'use client'

import { redirect } from 'next/navigation'

import { useUser } from '@/components/providers/UserProvider'
import { PropertyEditor } from '@/features/landlord/properties/editor/PropertyEditor'

import { PropertyEditorLoadingState } from '../../_components/PropertyEditorLoadingState'

export function CreatePropertyWorkspace() {
    const { user: currentUser, isLoading } = useUser()

    if (isLoading) {
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

    return <PropertyEditor mode="create" pageBackgroundClassName="bg-white" />
}
