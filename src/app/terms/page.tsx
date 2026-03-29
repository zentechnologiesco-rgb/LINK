import type { Metadata } from 'next'

import { LegalDocumentPage, type LegalSection } from '@/components/legal/LegalDocumentPage'

const lastUpdated = 'March 29, 2026'

const sections: LegalSection[] = [
    {
        title: '1. Acceptance of Terms',
        paragraphs: [
            'By accessing or using Link, you agree to be legally bound by these Terms of Service. If you do not agree, you must not use the platform.',
        ],
    },
    {
        title: '2. Description of Service',
        paragraphs: [
            'Link is a digital platform that facilitates long-term rental discovery, communication, and management between property owners or landlords and prospective and current tenants.',
            'Link does not own, lease, or manage properties directly unless explicitly stated.',
        ],
    },
    {
        title: '3. User Accounts',
        paragraphs: [
            '3.1 Eligibility',
            'Users must be at least 18 years old.',
            'Users must provide accurate and complete information.',
        ],
    },
    {
        title: '3.2 Account Responsibility',
        paragraphs: [
            'You are responsible for:',
        ],
        bullets: [
            'Maintaining account confidentiality.',
            'All activities under your account.',
        ],
    },
    {
        title: '4. User Roles',
        paragraphs: [
            '4.1 Tenants',
            'Tenants may:',
        ],
        bullets: [
            'Browse and search properties.',
            'Communicate with landlords.',
            'Enter into rental agreements.',
        ],
    },
    {
        title: '4.2 Landlords',
        paragraphs: [
            'Landlords may:',
        ],
        bullets: [
            'List properties.',
            'Communicate with tenants.',
            'Provide accurate property information.',
            'Manage rental agreements.',
        ],
    },
    {
        title: '5. Listings and Content',
        paragraphs: [
            '5.1 Accuracy',
            'Landlords must ensure listings are truthful and not misleading, and that prices, availability, and property details are accurate.',
            '5.2 Platform Rights',
        ],
        bullets: [
            'Review, approve, or remove listings.',
            'Suspend or ban users for violations.',
        ],
    },
    {
        title: '6. Rental Agreements',
        paragraphs: [
            'Link may provide tools to facilitate lease agreements.',
            'All rental agreements are between landlord and tenant.',
            'Link is not a party to any lease.',
        ],
    },
    {
        title: '7. Payments (If Applicable)',
        paragraphs: [
            'Link may facilitate rent or deposit payments.',
            'Link is not a financial institution.',
            'Payment processing may involve third-party providers.',
            'Users agree to pay applicable fees.',
            'Users agree that transaction failures are not the responsibility of Link.',
        ],
    },
    {
        title: '8. Prohibited Conduct',
        paragraphs: [
            'Users may not:',
        ],
        bullets: [
            'Post false or fraudulent listings.',
            'Engage in scams or misleading practices.',
            'Harass or abuse other users.',
            'Upload harmful or illegal content.',
            'Attempt to hack or disrupt the platform.',
        ],
    },
    {
        title: '9. Intellectual Property',
        paragraphs: [
            'All platform content, design, and systems belong to Zen Technologies.',
            'Users retain ownership of their uploaded content but grant Link a license to use it for platform operation.',
        ],
    },
    {
        title: '10. Platform Availability',
        paragraphs: [
            'Link is provided as is.',
            'We do not guarantee uninterrupted access.',
            'Maintenance and outages may occur.',
        ],
    },
    {
        title: '11. Limitation of Liability',
        paragraphs: [
            'Link is not liable for disputes between landlords and tenants, property condition or accuracy of listings, financial loss arising from transactions, or indirect or consequential damages.',
        ],
    },
    {
        title: '12. Indemnification',
        paragraphs: [
            'You agree to indemnify and hold harmless Link and Zen Technologies from any claims arising from your use of the platform or your violation of these terms.',
        ],
    },
    {
        title: '13. Termination',
        paragraphs: [
            'We may suspend or terminate accounts for violations of these terms or for fraudulent or harmful activity.',
            'Users may terminate their account at any time.',
        ],
    },
    {
        title: '14. Governing Law',
        paragraphs: [
            'These Terms are governed by the laws of Namibia.',
        ],
    },
    {
        title: '15. Changes to Terms',
        paragraphs: [
            'We may update these Terms at any time. Continued use of the platform constitutes acceptance of changes.',
        ],
    },
]

export const metadata: Metadata = {
    title: 'Terms of Service | LINK',
    description: 'Terms of Service for Link, operated by Zen Technologies in Namibia.',
}

export default function TermsPage() {
    return (
        <LegalDocumentPage
            eyebrow="Terms of Service"
            title="Terms of Service"
            description="These terms govern access to and use of Link, the long-term rental platform operated by Zen Technologies."
            lastUpdated={lastUpdated}
            highlights={[
                'Platform: Link (Long-Term Rental Platform)',
                'Operator: Zen Technologies',
                'Contact: zentechnologiesco@gmail.com',
                'Jurisdiction: Namibia',
            ]}
            sections={sections}
        />
    )
}
