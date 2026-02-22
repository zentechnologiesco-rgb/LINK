'use client'

import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { User, Shield, Loader2, Camera, ChevronRight, Lock, Mail, Phone, Upload, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'
import { useAuthActions } from "@convex-dev/auth/react"
import { useRouter } from 'next/navigation'

const TABS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
]

export default function SettingsPage() {
    const user = useQuery(api.users.currentUser)
    const updateProfile = useMutation(api.users.updateProfile)
    const generateUploadUrl = useMutation(api.files.generateUploadUrl)
    const { signOut } = useAuthActions()
    const router = useRouter()

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

    useEffect(() => {
        if (user && !initialized) {
            const nameParts = (user.fullName || '').split(' ')
            setProfile({
                firstName: nameParts[0] || '',
                surname: nameParts.slice(1).join(' ') || '',
                phone: user.phone || '',
            })
            setInitialized(true)
        }
    }, [user, initialized])

    const handleSaveProfile = async () => {
        if (!user) return
        setSaving(true)
        try {
            const fullName = `${profile.firstName} ${profile.surname}`.trim()
            await updateProfile({
                fullName: fullName,
                phone: profile.phone,
            })
            toast.success('Profile updated')
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

            if (!response.ok) throw new Error('Failed to upload file')

            const { storageId } = await response.json()
            await updateProfile({ avatarUrl: storageId })
            toast.success('Profile picture updated')
        } catch (error: any) {
            toast.error(error.message || 'Failed to upload avatar')
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleSignOut = async () => {
        await signOut()
        router.push('/')
    }

    // Loading skeleton
    if (user === undefined) {
        return (
            <div className="min-h-screen bg-[#fafafa]">
                <Header user={undefined} isLoading={true} />
                <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-24">
                    {/* Tab skeleton */}
                    <div className="flex gap-1 p-1 bg-neutral-100 rounded-lg mb-6">
                        <div className="flex-1 h-10 bg-neutral-200 rounded-md animate-pulse" />
                        <div className="flex-1 h-10 bg-transparent rounded-md" />
                    </div>
                    {/* Content skeleton */}
                    <div className="space-y-4">
                        <div className="bg-white rounded-xl border border-neutral-200 p-4">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-full bg-neutral-100 animate-pulse" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 w-32 bg-neutral-100 rounded animate-pulse" />
                                    <div className="h-3 w-48 bg-neutral-100 rounded animate-pulse" />
                                </div>
                            </div>
                        </div>
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-xl border border-neutral-200 p-4">
                                <div className="h-4 w-20 bg-neutral-100 rounded animate-pulse mb-3" />
                                <div className="h-11 bg-neutral-100 rounded-lg animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
                <MobileNav user={undefined} />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#fafafa] font-sans">
            <Header user={user} userRole={user?.role} />

            <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-24">
                {/* Tab Switcher */}
                <div className="flex p-1 bg-neutral-100 rounded-lg mb-6">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 h-10 rounded-md text-sm font-medium transition-all",
                                activeTab === tab.id
                                    ? "bg-white text-neutral-900 shadow-sm"
                                    : "text-neutral-500 hover:text-neutral-700"
                            )}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        {/* Avatar Card */}
                        <div className="bg-white rounded-xl border border-neutral-200 p-4">
                            <div className="flex items-center gap-4">
                                <div className="relative group">
                                    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden bg-neutral-100 border border-neutral-200">
                                        {user?.avatarUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-neutral-300">
                                                <User className="h-7 w-7" />
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-neutral-900 text-white flex items-center justify-center shadow-lg hover:bg-neutral-800 transition-colors"
                                    >
                                        {uploading ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Camera className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleAvatarUpload}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="font-semibold text-neutral-900 truncate">
                                        {user?.fullName || 'Your Name'}
                                    </h2>
                                    <p className="text-sm text-neutral-500 truncate">{user?.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Name Fields */}
                        <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-neutral-500">First Name</label>
                                    <input
                                        type="text"
                                        value={profile.firstName}
                                        onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                                        className="w-full h-11 px-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-900 focus:bg-white transition-colors"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-neutral-500">Surname</label>
                                    <input
                                        type="text"
                                        value={profile.surname}
                                        onChange={(e) => setProfile({ ...profile, surname: e.target.value })}
                                        className="w-full h-11 px-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-900 focus:bg-white transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contact Fields */}
                        <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-4">
                            {/* Email - Read Only */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-neutral-500">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                    <input
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="w-full h-11 pl-10 pr-10 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-500 cursor-not-allowed"
                                    />
                                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-300" />
                                </div>
                                <p className="text-[11px] text-neutral-400">Email is managed by your login provider</p>
                            </div>

                            {/* Phone */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-neutral-500">Phone</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                    <input
                                        type="tel"
                                        value={profile.phone}
                                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                        placeholder="+264 81 123 4567"
                                        className="w-full h-11 pl-10 pr-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-900 focus:bg-white transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="w-full h-12 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        {/* Password Card */}
                        <div className="bg-white rounded-xl border border-neutral-200 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                                        <Lock className="h-5 w-5 text-neutral-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-neutral-900">Password</h3>
                                        <p className="text-xs text-neutral-500">Managed by login provider</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-neutral-300" />
                            </div>
                        </div>

                        {/* Account Info */}
                        <div className="bg-white rounded-xl border border-neutral-200 p-4">
                            <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">Account</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-sm text-neutral-700">Role</span>
                                    <span className="text-sm font-medium text-neutral-900 capitalize">{user?.role || 'Tenant'}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-t border-neutral-100">
                                    <span className="text-sm text-neutral-700">Status</span>
                                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        Active
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Sign Out */}
                        <button
                            onClick={handleSignOut}
                            className="w-full h-12 bg-white hover:bg-neutral-50 border border-neutral-200 text-red-600 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </button>
                    </div>
                )}
            </div>

            <MobileNav user={user} userRole={user?.role} />
        </div>
    )
}
