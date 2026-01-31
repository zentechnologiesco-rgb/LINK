'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { User, Bell, Shield, CreditCard, Loader2, Camera, ChevronLeft, Lock, Mail, Phone, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'

const settingsTabs = [
    { id: 'profile', label: 'Profile', icon: User },
    // { id: 'notifications', label: 'Notifications', icon: Bell }, // Hidden for now to simplify
    { id: 'security', label: 'Security', icon: Shield },
    // { id: 'billing', label: 'Billing', icon: CreditCard }, // Hidden for now
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

    // Initialize profile state
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

            if (!response.ok) throw new Error('Failed to upload file')

            const { storageId } = await response.json()
            await updateProfile({ avatarUrl: storageId })
            toast.success('Profile picture updated!')
        } catch (error: any) {
            toast.error(error.message || 'Failed to upload avatar')
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    if (loading) return null // Or a skeleton loader if preferred

    return (
        <div className="min-h-screen bg-[#fafafa] font-sans text-neutral-900 pb-20">
            <Header user={user} userRole={user?.role} />

            <div className="max-w-[1200px] mx-auto pt-24 px-6 md:px-12 animate-in fade-in duration-500">

                {/* Header */}
                <div className="mb-12 border-b border-neutral-200/60 pb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-500 hover:text-neutral-900 transition-colors mb-4"
                    >
                        <ChevronLeft className="h-3 w-3" />
                        Back to Feed
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight">
                        Account Settings
                    </h1>
                </div>

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Sidebar */}
                    <aside className="w-full lg:w-64 shrink-0">
                        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide">
                            {settingsTabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                                        activeTab === tab.id
                                            ? 'bg-neutral-900 text-white shadow-sm'
                                            : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
                                    )}
                                >
                                    <tab.icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1 max-w-3xl">
                        {activeTab === 'profile' && (
                            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">

                                {/* Avatar Section */}
                                <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 border-b border-neutral-100">
                                    <div className="md:col-span-1">
                                        <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-widest font-mono mb-2">Public Profile</h2>
                                        <p className="text-sm text-neutral-500 leading-relaxed">This will be displayed on your listings and public interactions.</p>
                                    </div>

                                    <div className="md:col-span-2 flex items-center gap-6">
                                        <div className="relative group h-24 w-24 rounded-full overflow-hidden bg-neutral-100 border border-neutral-200">
                                            {user?.avatarUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-neutral-300">
                                                    <User className="h-8 w-8" />
                                                </div>
                                            )}

                                            {/* Hover Overlay */}
                                            <div
                                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                {uploading ? (
                                                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                                                ) : (
                                                    <Camera className="h-6 w-6 text-white" />
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-9 px-4 text-xs font-semibold rounded-lg border-neutral-200 bg-white hover:bg-neutral-50"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploading}
                                            >
                                                <Upload className="mr-2 h-3.5 w-3.5" />
                                                Upload New
                                            </Button>
                                            <p className="text-[11px] text-neutral-400">
                                                JPG or PNG. Max 2MB.
                                            </p>
                                        </div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleAvatarUpload}
                                            className="hidden"
                                            accept="image/*"
                                        />
                                    </div>
                                </section>

                                {/* Personal Info */}
                                <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="md:col-span-1">
                                        <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-widest font-mono mb-2">Personal Details</h2>
                                        <p className="text-sm text-neutral-500 leading-relaxed">Manage your verified identity and contact information.</p>
                                    </div>

                                    <div className="md:col-span-2 space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="firstName" className="text-xs font-medium text-neutral-500">First Name</Label>
                                                <Input
                                                    id="firstName"
                                                    value={profile.firstName}
                                                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                                                    className="h-10 bg-white border-neutral-200 focus:border-neutral-900 rounded-lg text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="surname" className="text-xs font-medium text-neutral-500">Surname</Label>
                                                <Input
                                                    id="surname"
                                                    value={profile.surname}
                                                    onChange={(e) => setProfile({ ...profile, surname: e.target.value })}
                                                    className="h-10 bg-white border-neutral-200 focus:border-neutral-900 rounded-lg text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="email" className="text-xs font-medium text-neutral-500">Email Address</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                                <Input
                                                    id="email"
                                                    value={user?.email || ''}
                                                    disabled
                                                    className="h-10 pl-9 bg-neutral-50 border-neutral-200 text-neutral-500 rounded-lg text-sm cursor-not-allowed"
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <Lock className="h-3 w-3 text-neutral-400" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="phone" className="text-xs font-medium text-neutral-500">Phone Number</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                                <Input
                                                    id="phone"
                                                    value={profile.phone}
                                                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                                    placeholder="+264 81 123 4567"
                                                    className="h-10 pl-9 bg-white border-neutral-200 focus:border-neutral-900 rounded-lg text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <Button
                                                onClick={handleSaveProfile}
                                                disabled={saving}
                                                className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg h-10 px-6 font-medium text-sm transition-all"
                                            >
                                                {saving ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : 'Save Changes'}
                                            </Button>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="md:col-span-1">
                                        <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-widest font-mono mb-2">Authentication</h2>
                                        <p className="text-sm text-neutral-500 leading-relaxed">Update your password security.</p>
                                    </div>

                                    <div className="md:col-span-2">
                                        <div className="p-6 rounded-xl border border-neutral-200 bg-white flex items-start justify-between group hover:border-neutral-300 transition-colors">
                                            <div>
                                                <h3 className="font-semibold text-neutral-900 mb-1">Password</h3>
                                                <p className="text-sm text-neutral-500 mb-4 max-w-sm">
                                                    We recommend using a strong password that you aren't using elsewhere.
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    Last changed: Never
                                                </div>
                                            </div>
                                            <Button variant="outline" className="h-9 px-4 text-xs font-semibold rounded-lg border-neutral-200 bg-white hover:bg-neutral-50">
                                                Update
                                            </Button>
                                        </div>
                                    </div>
                                </section>
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
