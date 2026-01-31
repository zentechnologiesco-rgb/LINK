'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { User, Bell, Shield, CreditCard, Loader2, Camera, Check, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'

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
            const uploadUrl = await generateUploadUrl({
                contentType: file.type,
                fileSize: file.size,
            })

            const response = await fetch(uploadUrl, {
                method: 'POST',
                headers: { 'Content-Type': file.type },
                body: file,
            })

            if (!response.ok) {
                throw new Error('Failed to upload file')
            }

            const { storageId } = await response.json()

            // Save the storageId directly. The backend will resolve this to a URL.
            await updateProfile({ avatarUrl: storageId })
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
                    <div className="h-10 w-10 rounded-full border-2 border-black/10 border-t-black animate-spin" />
                    <p className="text-sm text-black/60 font-medium">Loading settings...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white">
            <Header user={user} userRole={user?.role} />

            <div className="max-w-[2000px] mx-auto px-4 md:px-6 py-8 pt-24">
                {/* Back Link */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-black/40 hover:text-black transition-colors mb-8"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                </Link>

                <div className="flex flex-col md:flex-row gap-12">
                    {/* Sidebar Tabs */}
                    <div className="w-full md:w-64 shrink-0">
                        <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-4 md:pb-0 scrollbar-hide">
                            {settingsTabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        'group flex items-center gap-4 px-4 py-3 rounded-full transition-all duration-200 ease-in-out whitespace-nowrap',
                                        activeTab === tab.id
                                            ? 'bg-black text-white shadow-lg shadow-black/10'
                                            : 'text-black/60 font-medium hover:bg-black/5 hover:text-black'
                                    )}
                                >
                                    <tab.icon className={cn(
                                        "h-5 w-5",
                                        activeTab === tab.id ? "text-white" : "text-black/60 group-hover:text-black"
                                    )} />
                                    <span className="text-sm font-medium tracking-wide">{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="flex-1 max-w-2xl">
                        {activeTab === 'profile' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Avatar Section */}
                                <section>
                                    <h2 className="font-[family-name:var(--font-anton)] text-2xl text-black mb-6 uppercase tracking-wide">
                                        Profile Picture
                                    </h2>
                                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                            <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-xl shadow-black/5 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                                                {user?.avatarUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={user.avatarUrl}
                                                        alt="Profile"
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-4xl font-bold text-black/20 group-hover:text-black/40 transition-colors">
                                                        {profile.firstName && profile.surname
                                                            ? `${profile.firstName.charAt(0)}${profile.surname.charAt(0)}`.toUpperCase()
                                                            : profile.firstName?.charAt(0)?.toUpperCase() || 'U'
                                                        }
                                                    </span>
                                                )}

                                                {/* Overlay */}
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                                                    <Camera className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300" />
                                                </div>
                                            </div>

                                            {uploading && (
                                                <div className="absolute inset-0 z-10 bg-white/80 rounded-full flex items-center justify-center backdrop-blur-sm">
                                                    <Loader2 className="h-8 w-8 text-black animate-spin" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 w-full md:w-auto text-center md:text-left">
                                            <div className="flex flex-col sm:flex-row gap-3 mb-3 justify-center md:justify-start">
                                                <Button
                                                    variant="outline"
                                                    className="rounded-xl border-black/10 hover:bg-black hover:text-white transition-colors h-11 px-6 font-medium"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={uploading}
                                                >
                                                    {uploading ? 'Uploading...' : 'Change Photo'}
                                                </Button>
                                                {user?.avatarUrl && (
                                                    <Button
                                                        variant="ghost"
                                                        className="rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 h-11 px-6 font-medium"
                                                        onClick={() => {/* Implement remove photo */ }}
                                                    >
                                                        Remove
                                                    </Button>
                                                )}
                                            </div>
                                            <p className="text-sm text-black/40 font-medium">
                                                Accepts JPG, GIF or PNG. Max size 2MB.
                                            </p>
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
                                    <h2 className="font-[family-name:var(--font-anton)] text-2xl text-black mb-6 uppercase tracking-wide">
                                        Personal Information
                                    </h2>
                                    <div className="grid gap-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="firstName" className="text-sm font-bold text-black/80 ml-1">First Name</Label>
                                                <Input
                                                    id="firstName"
                                                    value={profile.firstName}
                                                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                                                    placeholder="Enter your first name"
                                                    className="h-12 rounded-xl bg-gray-50 border-transparent focus:border-black/20 focus:bg-white focus:ring-0 transition-all font-medium placeholder:text-black/20"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="surname" className="text-sm font-bold text-black/80 ml-1">Surname</Label>
                                                <Input
                                                    id="surname"
                                                    value={profile.surname}
                                                    onChange={(e) => setProfile({ ...profile, surname: e.target.value })}
                                                    placeholder="Enter your surname"
                                                    className="h-12 rounded-xl bg-gray-50 border-transparent focus:border-black/20 focus:bg-white focus:ring-0 transition-all font-medium placeholder:text-black/20"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-sm font-bold text-black/80 ml-1">Email Address</Label>
                                            <Input
                                                id="email"
                                                value={user?.email || ''}
                                                disabled
                                                className="h-12 rounded-xl bg-gray-50/50 border-transparent text-black/40 font-medium"
                                            />
                                            <p className="text-[11px] text-black/40 font-medium ml-1">Email address is managed via your secure login provider.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="text-sm font-bold text-black/80 ml-1">Phone Number</Label>
                                            <Input
                                                id="phone"
                                                value={profile.phone}
                                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                                placeholder="+1 (555) 000-0000"
                                                className="h-12 rounded-xl bg-gray-50 border-transparent focus:border-black/20 focus:bg-white focus:ring-0 transition-all font-medium placeholder:text-black/20"
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Save Button */}
                                <div className="pt-6">
                                    <Button
                                        onClick={handleSaveProfile}
                                        disabled={saving}
                                        className="w-full md:w-auto bg-black hover:bg-gray-900 text-white rounded-xl h-12 px-8 font-bold tracking-wide shadow-xl shadow-black/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                SAVING...
                                            </>
                                        ) : (
                                            <>
                                                SAVE CHANGES
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h2 className="font-[family-name:var(--font-anton)] text-2xl text-black mb-2 uppercase tracking-wide">
                                    Notification Preferences
                                </h2>
                                <p className="text-black/60 font-medium mb-8">Choose how you want to be notified</p>

                                <div className="p-12 rounded-2xl bg-gray-50 border-2 border-dashed border-black/5 text-center flex flex-col items-center justify-center">
                                    <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                                        <Bell className="h-8 w-8 text-black/20" />
                                    </div>
                                    <h3 className="text-lg font-bold text-black mb-1">Coming Soon</h3>
                                    <p className="text-black/40 max-w-xs mx-auto">We're working on more granular notification controls for you.</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h2 className="font-[family-name:var(--font-anton)] text-2xl text-black mb-2 uppercase tracking-wide">
                                    Security Settings
                                </h2>
                                <p className="text-black/60 font-medium mb-8">Manage your account security and authentication</p>

                                <div className="p-8 rounded-2xl bg-gray-50 border border-transparent hover:border-black/5 transition-all">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-bold text-black mb-2">Password</h3>
                                            <p className="text-sm text-black/60 mb-6 max-w-sm">Secure your account with a strong password. We recommend changing it periodically.</p>
                                        </div>
                                        <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center">
                                            <Shield className="h-5 w-5 text-black" />
                                        </div>
                                    </div>
                                    <Button variant="outline" className="rounded-xl border-black/10 hover:bg-black hover:text-white h-11 px-6 font-medium bg-white">
                                        Update Password
                                    </Button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'billing' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h2 className="font-[family-name:var(--font-anton)] text-2xl text-black mb-2 uppercase tracking-wide">
                                    Billing & Payments
                                </h2>
                                <p className="text-black/60 font-medium mb-8">Manage your subscription and payment methods</p>

                                <div className="p-12 rounded-2xl bg-gray-50 border-2 border-dashed border-black/5 text-center flex flex-col items-center justify-center">
                                    <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                                        <CreditCard className="h-8 w-8 text-black/20" />
                                    </div>
                                    <h3 className="text-lg font-bold text-black mb-1">No Active Plan</h3>
                                    <p className="text-black/40 max-w-xs mx-auto mb-6">You are currently on the free plan. Upgrade to unlock premium features.</p>
                                    <Button className="bg-black text-white hover:bg-gray-900 rounded-xl h-11 px-6 font-bold">
                                        View Plans
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <MobileNav user={user} />
        </div>
    )
}

export default function SettingsPage() {
    return <SettingsContent />
}
