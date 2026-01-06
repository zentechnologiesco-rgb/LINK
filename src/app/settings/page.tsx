'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { User, Bell, Shield, CreditCard, Upload, Loader2, Camera } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/user-name'

const settingsTabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
]

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [activeTab, setActiveTab] = useState('profile')
    const [profile, setProfile] = useState({
        firstName: '',
        surname: '',
        email: '',
        phone: '',
        avatar_url: '',
    })
    const fileInputRef = useRef<HTMLInputElement>(null)

    const supabase = createClient()

    useEffect(() => {
        const loadUserData = async () => {
            // Use getSession() for faster initial load - it uses cached data
            // instead of getUser() which always makes a network verification call
            const { data: { session } } = await supabase.auth.getSession()

            if (!session?.user) {
                setLoading(false)
                return
            }

            const user = session.user
            setUser(user)

            // Fetch profile data
            const { data: profileData } = await supabase
                .from('profiles')
                .select('first_name, surname, phone, avatar_url')
                .eq('id', user.id)
                .single()

            setProfile({
                firstName: user.user_metadata?.first_name || profileData?.first_name || '',
                surname: user.user_metadata?.surname || profileData?.surname || '',
                email: user.email || '',
                phone: user.user_metadata?.phone || profileData?.phone || '',
                avatar_url: profileData?.avatar_url || '',
            })

            setLoading(false)
        }
        loadUserData()
    }, [])

    const handleSaveProfile = async () => {
        setSaving(true)
        try {
            const fullName = `${profile.firstName} ${profile.surname}`.trim()

            // Update auth metadata
            const { error: authError } = await supabase.auth.updateUser({
                data: {
                    first_name: profile.firstName,
                    surname: profile.surname,
                    full_name: fullName,
                    phone: profile.phone,
                }
            })
            if (authError) throw authError

            // Update profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    first_name: profile.firstName,
                    surname: profile.surname,
                    full_name: fullName,
                    phone: profile.phone,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id)

            if (profileError) throw profileError

            toast.success('Profile updated successfully')
        } catch (error: any) {
            toast.error(error.message || 'Failed to update profile')
        }
        setSaving(false)
    }


    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = event.target.files?.[0]
            if (!file) return

            setUploading(true)

            if (!file.type.startsWith('image/')) {
                toast.error('Please upload an image file')
                return
            }

            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                toast.error('Image size must be less than 2MB')
                return
            }

            const fileExt = file.name.split('.').pop()
            const filePath = `${user.id}/avatar-${Math.random()}.${fileExt}`

            // Upload image to Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            // Update local state
            setProfile(prev => ({ ...prev, avatar_url: publicUrl }))

            // Update profile in DB immediately
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    avatar_url: publicUrl, // Ensure this column name matches your DB
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id)

            if (updateError) throw updateError

            toast.success('Profile picture updated')
        } catch (error: any) {
            console.error('Error uploading avatar:', error)
            toast.error(error.message || 'Error uploading avatar')
        } finally {
            setUploading(false)
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

    if (!user) {
        return (
            <div className="p-6 lg:p-8">
                <div className="text-center py-16">
                    <p className="text-gray-500">Please sign in to view settings</p>
                    <Link href="/sign-in">
                        <Button className="mt-4 bg-gray-900 hover:bg-gray-800">Sign In</Button>
                    </Link>
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
                                            <AvatarImage src={profile.avatar_url} className="object-cover" />
                                            <AvatarFallback className="bg-gray-100 text-gray-400 text-xl">
                                                {getInitials({ first_name: profile.firstName, surname: profile.surname }, user.email?.charAt(0) || 'U')}
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
                                            value={profile.email}
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
