import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (
        !user &&
        !request.nextUrl.pathname.startsWith('/sign-in') &&
        !request.nextUrl.pathname.startsWith('/sign-up') &&
        !request.nextUrl.pathname.startsWith('/search') &&
        !request.nextUrl.pathname.startsWith('/properties') &&
        request.nextUrl.pathname !== '/'
    ) {
        // no user, potentially redirect to login if accessing protected route
        const url = request.nextUrl.clone()
        url.pathname = '/sign-in'
        return NextResponse.redirect(url)
    }

    // Role-based protection
    if (user) {
        const role = user.user_metadata.role as string || 'tenant'
        const path = request.nextUrl.pathname

        // Prevent signed-in users from accessing auth pages
        if (path.startsWith('/sign-in') || path.startsWith('/sign-up')) {
            const url = request.nextUrl.clone()
            // Redirect to their specific dashboard or home
            if (role === 'admin') url.pathname = '/dashboard/admin'
            else if (role === 'landlord') url.pathname = '/dashboard/landlord'
            else url.pathname = '/dashboard/tenant'
            return NextResponse.redirect(url)
        }

        // Protect Landlord Routes
        if (path.startsWith('/dashboard/landlord') && role !== 'landlord' && role !== 'admin') {
            const url = request.nextUrl.clone()
            url.pathname = '/'
            return NextResponse.redirect(url)
        }

        // Protect Admin Routes
        if (path.startsWith('/dashboard/admin') && role !== 'admin') {
            const url = request.nextUrl.clone()
            url.pathname = '/'
            return NextResponse.redirect(url)
        }
    }

    return response
}
