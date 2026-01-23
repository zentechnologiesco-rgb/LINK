'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { User, Bell, Shield, CreditCard, Loader2, Camera, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"

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

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file')
            return
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error('File size must be less than 2MB')
            return
        }

        setUploading(true)
        try {
            const uploadUrl = await generateUploadUrl()

            const response = await fetch(uploadUrl, {
                method: 'POST',
                headers: { 'Content-Type': file.type },
                body: file,
            })

            if (!response.ok) {
                throw new Error('Failed to upload file')
            }

            const { storageId } = await response.json()
            const avatarUrl = `${process.env.NEXT_PUBLIC_CONVEX_URL?.replace('.cloud', '.site')}/api/storage/${storageId}`

            await updateProfile({ avatarUrl })
            toast.success('Profile picture updated!')
        } catch (error: any) {
            toast.error(error.message || 'Failed to upload avatar')
        } finally {
            setUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-2 border-lime-500/20 border-t-lime-500 animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading settings...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="px-6 py-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
                    <p className="text-muted-foreground mt-1">Manage your account preferences</p>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar Tabs */}
                    <div className="w-full md:w-48 shrink-0">
                        <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
                            {settingsTabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        'flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                                        activeTab === tab.id
                                            ? 'bg-lime-500 text-white shadow-lg shadow-lime-500/20'
                                            : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                                    )}
                                >
                                    <tab.icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                        {activeTab === 'profile' && (
                            <div className="space-y-8">
                                {/* Avatar Section */}
                                <section>
                                    <h2 className="text-lg font-medium text-foreground mb-4">Profile Picture</h2>
                                    <div className="flex items-center gap-6">
                                        <div className="relative group">
                                            <div className="h-24 w-24 rounded-full overflow-hidden bg-sidebar-accent flex items-center justify-center">
                                                {user?.avatarUrl ? (
                                                    /* eslint-disable-next-line @next/next/no-img-element */
                                                    <img
                                                        src={user.avatarUrl}
                                                        alt="Profile"
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-2xl font-medium text-muted-foreground">
                                                        {profile.firstName && profile.surname
                                                            ? `${profile.firstName.charAt(0)}${profile.surname.charAt(0)}`.toUpperCase()
                                                            : profile.firstName?.charAt(0)?.toUpperCase() || 'U'
                                                        }
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <Camera className="h-6 w-6 text-white" />
                                            </button>
                                            {uploading && (
                                                <div className="absolute inset-0 bg-white/60 rounded-full flex items-center justify-center">
                                                    <Loader2 className="h-6 w-6 text-lime-500 animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-2">JPG, GIF or PNG. Max size 2MB.</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="rounded-lg"
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
                                </section>

                                {/* Personal Info Section */}
                                <section>
                                    <h2 className="text-lg font-medium text-foreground mb-4">Personal Information</h2>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="firstName" className="text-foreground">First Name</Label>
                                                <Input
                                                    id="firstName"
                                                    value={profile.firstName}
                                                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                                                    placeholder="Enter your first name"
                                                    className="mt-1.5 h-11 rounded-lg bg-sidebar-accent border-0 focus-visible:ring-2 focus-visible:ring-lime-500/50"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="surname" className="text-foreground">Surname</Label>
                                                <Input
                                                    id="surname"
                                                    value={profile.surname}
                                                    onChange={(e) => setProfile({ ...profile, surname: e.target.value })}
                                                    placeholder="Enter your surname"
                                                    className="mt-1.5 h-11 rounded-lg bg-sidebar-accent border-0 focus-visible:ring-2 focus-visible:ring-lime-500/50"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="email" className="text-foreground">Email</Label>
                                            <Input
                                                id="email"
                                                value={user?.email || ''}
                                                disabled
                                                className="mt-1.5 h-11 rounded-lg bg-sidebar-accent/50 border-0 text-muted-foreground"
                                            />
                                            <p className="text-xs text-muted-foreground mt-1.5">Email cannot be changed</p>
                                        </div>
                                        <div>
                                            <Label htmlFor="phone" className="text-foreground">Phone Number</Label>
                                            <Input
                                                id="phone"
                                                value={profile.phone}
                                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                                placeholder="+264 81 000 0000"
                                                className="mt-1.5 h-11 rounded-lg bg-sidebar-accent border-0 focus-visible:ring-2 focus-visible:ring-lime-500/50"
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Save Button */}
                                <div className="pt-4 border-t border-border">
                                    <Button
                                        onClick={handleSaveProfile}
                                        disabled={saving}
                                        className="bg-lime-500 hover:bg-lime-600 text-white rounded-lg h-11 px-6 font-medium shadow-lg shadow-lime-500/20"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="mr-2 h-4 w-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div>
                                <h2 className="text-lg font-medium text-foreground mb-1">Notification Preferences</h2>
                                <p className="text-sm text-muted-foreground mb-6">Manage how you receive notifications</p>
                                <div className="p-8 rounded-xl bg-sidebar-accent/30 text-center">
                                    <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                                    <p className="text-muted-foreground">Notification settings coming soon...</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div>
                                <h2 className="text-lg font-medium text-foreground mb-1">Security Settings</h2>
                                <p className="text-sm text-muted-foreground mb-6">Manage your account security</p>
                                <div className="p-6 rounded-xl bg-sidebar-accent/30">
                                    <h3 className="font-medium text-foreground mb-2">Password</h3>
                                    <p className="text-sm text-muted-foreground mb-4">Update your password to keep your account secure</p>
                                    <Button variant="outline" className="rounded-lg">Change Password</Button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'billing' && (
                            <div>
                                <h2 className="text-lg font-medium text-foreground mb-1">Billing & Subscription</h2>
                                <p className="text-sm text-muted-foreground mb-6">Manage your billing information</p>
                                <div className="p-8 rounded-xl bg-sidebar-accent/30 text-center">
                                    <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                                    <p className="text-muted-foreground">Billing settings coming soon...</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function SettingsPage() {
    return <SettingsContent />
}
