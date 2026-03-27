import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default function LandlordLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <DashboardLayout title="Landlord Dashboard">
            {children}
        </DashboardLayout>
    )
}
