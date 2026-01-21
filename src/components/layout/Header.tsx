'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Menu, Search, User } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { getDisplayName, getInitials } from '@/lib/user-name'
import { useQuery } from "convex/react"
import { useAuthActions } from "@convex-dev/auth/react"
import { api } from "../../../convex/_generated/api"

export function Header() {
    const user = useQuery(api.users.currentUser)
    const router = useRouter()
    const { signOut } = useAuthActions()

    const handleSignOut = async () => {
        await signOut()
        router.push('/')
        router.refresh()
        toast.success('Signed out successfully')
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="text-xl font-bold tracking-tight">LINK</span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                        <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground/60">
                            Rent
                        </Link>
                        <Link href="#" className="transition-colors hover:text-foreground/80 text-foreground/60">
                            Buy
                        </Link>
                        <Link href="#" className="transition-colors hover:text-foreground/80 text-foreground/60">
                            Sell
                        </Link>
                        <Link href="#" className="transition-colors hover:text-foreground/80 text-foreground/60">
                            Manage Property
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    {/* Mobile Menu */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" className="md:hidden h-8 w-8 px-0">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left">
                            <div className="grid gap-4 py-4">
                                <Link href="/" className="text-lg font-semibold">
                                    Rent
                                </Link>
                                <Link href="#" className="text-lg font-semibold">
                                    Buy
                                </Link>
                                <Link href="#" className="text-lg font-semibold">
                                    Manage Property
                                </Link>
                            </div>
                        </SheetContent>
                    </Sheet>

                    {user === undefined ? (
                        // Auth Loading State
                        <div className="h-9 w-9 bg-gray-100 rounded-full animate-pulse" />
                    ) : user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={user.avatarUrl} alt={user.email || ''} />
                                        <AvatarFallback>{getInitials(user) || user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{getDisplayName(user)}</p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {user.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => router.push(`/dashboard/${user.role || 'tenant'}`)}>
                                    Dashboard
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push('/profile')}>
                                    Profile
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleSignOut}>
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link href="/sign-in">
                                <Button variant="ghost" size="sm">Log in</Button>
                            </Link>
                            <Link href="/sign-up">
                                <Button size="sm" className="bg-black hover:bg-zinc-800 text-white">Sign up</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
