import type { Metadata } from 'next'

import { LegalDocumentPage, type LegalSection } from '@/components/legal/LegalDocumentPage'

const lastUpdated = 'March 29, 2026'

const sections: LegalSection[] = [
    {
        title: '1. Overview',
        paragraphs: [
            'This Privacy Policy explains how we collect, use, and protect your personal information when using Link.',
        ],
    },
    {
        title: '2. Information We Collect',
        paragraphs: [
            '2.1 Personal Information',
        ],
        bullets: [
            'Name',
            'Email address',
            'Phone number',
            'Identification documents (for verification)',
        ],
    },
    {
        title: '2.2 Usage Data',
        bullets: [
            'Login activity',
            'Messages sent on the platform',
            'Property interactions',
        ],
        paragraphs: [],
    },
    {
        title: '2.3 Device & Technical Data',
        bullets: [
            'IP address',
            'Browser type',
            'Device information',
        ],
        paragraphs: [],
    },
    {
        title: '3. How We Use Your Information',
        paragraphs: [
            'We use data to:',
        ],
        bullets: [
            'Provide and operate the platform.',
            'Enable landlord-tenant communication.',
            'Verify users and prevent fraud.',
            'Improve user experience.',
            'Send important notifications.',
        ],
    },
    {
        title: '4. Data Sharing',
        paragraphs: [
            'We may share data with other users, such as for landlord and tenant communication, with service providers such as hosting and payments, and with legal authorities when required by law.',
            'We do not sell user data.',
        ],
    },
    {
        title: '5. Data Storage & Security',
        paragraphs: [
            'Data is stored securely using modern security practices.',
            'We implement safeguards to prevent unauthorized access.',
            'However, no system is completely secure.',
        ],
    },
    {
        title: '6. Data Retention',
        paragraphs: [
            'We retain data as long as your account is active and as necessary for legal or operational purposes.',
        ],
    },
    {
        title: '7. User Rights',
        paragraphs: [
            'You have the right to access your data, correct inaccurate data, request deletion of your data, and withdraw consent where applicable.',
            'Requests can be sent to zentechnologiesco@gmail.com.',
        ],
    },
    {
        title: '8. Cookies & Tracking',
        paragraphs: [
            'We may use cookies to maintain sessions, improve functionality, and analyze usage.',
            'Users can control cookies via browser settings.',
        ],
    },
    {
        title: '9. Third-Party Services',
        paragraphs: [
            'Link may integrate with payment providers and analytics tools.',
            'These services have their own privacy policies.',
        ],
    },
    {
        title: '10. Children’s Privacy',
        paragraphs: [
            'Link is not intended for users under 18. We do not knowingly collect data from minors.',
        ],
    },
    {
        title: '11. Changes to Privacy Policy',
        paragraphs: [
            'We may update this policy. Continued use of the platform means acceptance of updates.',
        ],
    },
    {
        title: '12. Contact',
        paragraphs: [
            'For all privacy-related inquiries: zentechnologiesco@gmail.com',
        ],
    },
]

export const metadata: Metadata = {
    title: 'Privacy Policy | LINK',
    description: 'Privacy Policy for Link, operated by Zen Technologies.',
}

export default function PrivacyPage() {
    return (
        <LegalDocumentPage
            eyebrow="Privacy Policy"
            title="Privacy Policy"
            description="This policy explains how Link collects, uses, and protects personal information across the platform."
            lastUpdated={lastUpdated}
            highlights={[
                'Platform: Link',
                'Operator: Zen Technologies',
                'Contact: zentechnologiesco@gmail.com',
            ]}
            sections={sections}
        />
    )
}
