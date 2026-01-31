import { redirect } from 'next/navigation'

// Search page is now integrated into the home page
// This redirect ensures any existing links to /search still work
export default function SearchPage() {
    redirect('/')
}
