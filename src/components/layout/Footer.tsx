import Link from 'next/link'

export function Footer() {
    return (
        <footer className="border-t bg-background">
            <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0 px-4 max-w-screen-2xl">
                <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        Built for Namibia 🇳🇦. &copy; {new Date().getFullYear()} LINK Property Platform.
                    </p>
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground">
                    <Link href="#" className="hover:underline">Terms</Link>
                    <Link href="#" className="hover:underline">Privacy</Link>
                    <Link href="#" className="hover:underline">Contact</Link>
                </div>
            </div>
        </footer>
    )
}
