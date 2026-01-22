'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { User, Bell, Shield, CreditCard, Loader2, Camera } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react"

const settingsTabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
]

function SettingsContent() {
    const user = useQuery(api.users.currentUser)
    const updateProfile = useMutation(api.users.updateProfile)
    const generateUploadUrl = useMutation(api.files.generateUploadUrl)

    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [activeTab, setActiveTab] = useState('profile')
    const [profile, setProfile] = useState({
        firstName: '',
        surname: '',
        phone: '',
    })
    const [initialized, setInitialized] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Initialize profile state when user data loads
    if (user && !initialized) {
        const nameParts = (user.fullName || '').split(' ')
        setProfile({
            firstName: nameParts[0] || '',
            surname: nameParts.slice(1).join(' ') || '',
            phone: user.phone || '',
        })
        setInitialized(true)
    }

    const loading = user === undefined

    const handleSaveProfile = async () => {
        if (!user) return
        setSaving(true)
        try {
            const fullName = `${profile.firstName} ${profile.surname}`.trim()
            await updateProfile({
                fullName: fullName,
                phone: profile.phone,
            })
            toast.success('Profile updated successfully')
        } catch (error: any) {
            toast.error(error.message || 'Failed to update profile')
        }
        setSaving(false)
    }

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file')
            return
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('File size must be less than 2MB')
            return
        }

        setUploading(true)
        try {
            // Get upload URL from Convex
            const uploadUrl = await generateUploadUrl()

            // Upload the file
            const response = await fetch(uploadUrl, {
                method: 'POST',
                headers: { 'Content-Type': file.type },
                body: file,
            })

            if (!response.ok) {
                throw new Error('Failed to upload file')
            }

            const { storageId } = await response.json()

            // Get the public URL for the uploaded file
            // For now, we'll store the storage ID and the files API will handle URL generation
            // The avatarUrl field stores a URL, so we need to construct it
            const avatarUrl = `${process.env.NEXT_PUBLIC_CONVEX_URL?.replace('.cloud', '.site')}/api/storage/${storageId}`

            // Update the user profile with the new avatar URL
            await updateProfile({ avatarUrl })

            toast.success('Profile picture updated!')
        } catch (error: any) {
            toast.error(error.message || 'Failed to upload avatar')
        } finally {
            setUploading(false)
            // Reset the input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    if (loading) {
        return (
            <div className="p-6 lg:p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-48 bg-gray-200 rounded" />
                    <div className="h-64 bg-gray-100 rounded-xl" />
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 lg:p-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Settings</h1>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar Tabs */}
                <div className="w-full md:w-48 shrink-0">
                    <nav className="space-y-1">
                        {settingsTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left',
                                    activeTab === tab.id
                                        ? 'bg-gray-900 text-white'
                                        : 'text-gray-600 hover:bg-gray-100'
                                )}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <div className="flex-1 max-w-2xl">
                    {activeTab === 'profile' && (
                        <Card className="border-gray-100">
                            <CardHeader>
                                <CardTitle className="text-lg">Profile Information</CardTitle>
                                <CardDescription>Update your personal details and profile picture</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Avatar Upload Section */}
                                <div className="flex items-center gap-6">
                                    <div className="relative group">
                                        <Avatar className="h-24 w-24 border-2 border-gray-100">
                                            <AvatarImage src={user?.avatarUrl} className="object-cover" />
                                            <AvatarFallback className="bg-gray-100 text-gray-400 text-xl">
                                                {profile.firstName && profile.surname
                                                    ? `${profile.firstName.charAt(0)}${profile.surname.charAt(0)}`.toUpperCase()
                                                    : profile.firstName?.charAt(0)?.toUpperCase() || 'U'
                                                }
                                            </AvatarFallback>
                                        </Avatar>
                                        <div
                                            className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Camera className="h-6 w-6 text-white" />
                                        </div>
                                        {uploading && (
                                            <div className="absolute inset-0 bg-white/60 rounded-full flex items-center justify-center">
                                                <Loader2 className="h-6 w-6 text-gray-900 animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-medium text-sm text-gray-900">Profile Picture</h4>
                                        <p className="text-xs text-gray-500">JPG, GIF or PNG. Max size of 2MB.</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-2"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                        >
                                            {uploading ? 'Uploading...' : 'Upload New'}
                                        </Button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleAvatarUpload}
                                            className="hidden"
                                            accept="image/*"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">First Name</Label>
                                            <Input
                                                id="firstName"
                                                value={profile.firstName}
                                                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                                                placeholder="Enter your first name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="surname">Surname</Label>
                                            <Input
                                                id="surname"
                                                value={profile.surname}
                                                onChange={(e) => setProfile({ ...profile, surname: e.target.value })}
                                                placeholder="Enter your surname"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            value={user?.email || ''}
                                            disabled
                                            className="bg-gray-50"
                                        />
                                        <p className="text-xs text-gray-500">Email cannot be changed</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            value={profile.phone}
                                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                            placeholder="+264 81 000 0000"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleSaveProfile}
                                        disabled={saving}
                                        className="bg-gray-900 hover:bg-gray-800"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : 'Save Changes'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'notifications' && (
                        <Card className="border-gray-100">
                            <CardHeader>
                                <CardTitle className="text-lg">Notification Preferences</CardTitle>
                                <CardDescription>Manage how you receive notifications</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-500 text-sm">Notification settings coming soon...</p>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'security' && (
                        <Card className="border-gray-100">
                            <CardHeader>
                                <CardTitle className="text-lg">Security Settings</CardTitle>
                                <CardDescription>Manage your account security</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-2">Password</h3>
                                    <p className="text-sm text-gray-500 mb-3">Update your password to keep your account secure</p>
                                    <Button variant="outline">Change Password</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'billing' && (
                        <Card className="border-gray-100">
                            <CardHeader>
                                <CardTitle className="text-lg">Billing & Subscription</CardTitle>
                                <CardDescription>Manage your billing information</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-500 text-sm">Billing settings coming soon...</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function SettingsPage() {
    return <SettingsContent />
}
