import type { SVGProps } from 'react'

export function GoogleIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <path
                d="M21.81 12.23c0-.72-.06-1.4-.19-2.05H12v3.88h5.5a4.67 4.67 0 0 1-2.04 3.07v2.55h3.29c1.93-1.78 3.06-4.4 3.06-7.45Z"
                fill="#4285F4"
            />
            <path
                d="M12 22c2.76 0 5.07-.91 6.75-2.47l-3.29-2.55c-.91.61-2.08.98-3.46.98-2.66 0-4.92-1.8-5.72-4.22H2.89v2.63A10 10 0 0 0 12 22Z"
                fill="#34A853"
            />
            <path
                d="M6.28 13.74a5.97 5.97 0 0 1 0-3.48V7.63H2.89a10 10 0 0 0 0 8.74l3.39-2.63Z"
                fill="#FBBC05"
            />
            <path
                d="M12 6.04c1.5 0 2.85.52 3.91 1.53l2.93-2.93C17.06 2.98 14.75 2 12 2a10 10 0 0 0-9.11 5.63l3.39 2.63c.8-2.42 3.06-4.22 5.72-4.22Z"
                fill="#EA4335"
            />
        </svg>
    )
}
