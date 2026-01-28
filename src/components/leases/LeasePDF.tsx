import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer'
import { format } from 'date-fns'

// Register standard fonts
Font.register({
    family: 'Helvetica',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf' }, // Standard
        { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf', fontWeight: 'bold' }, // Bold placeholder
    ]
})

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#000000',
    },
    header: {
        backgroundColor: '#000000',
        color: '#FFFFFF',
        padding: 20,
        marginBottom: 20,
        textAlign: 'center',
    },
    headerTitle: {
        fontSize: 24,
        textTransform: 'uppercase',
        marginBottom: 5,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 10,
        textTransform: 'uppercase',
        opacity: 0.8,
        letterSpacing: 2,
    },
    section: {
        marginBottom: 20,
        padding: 10,
        border: '1px solid #EEEEEE',
        borderRadius: 4,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 10,
        backgroundColor: '#F9FAFB',
        padding: 5,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 5,
        gap: 10,
    },
    col: {
        flex: 1,
    },
    label: {
        fontSize: 8,
        color: '#666666',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    value: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    clause: {
        marginBottom: 10,
    },
    clauseTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    clauseContent: {
        fontSize: 10,
        lineHeight: 1.4,
        color: '#444444',
    },
    signatureSection: {
        marginTop: 30,
        flexDirection: 'row',
        gap: 20,
    },
    signatureBox: {
        flex: 1,
        border: '1px dashed #CCCCCC',
        padding: 10,
        height: 100,
        justifyContent: 'flex-end',
    },
    signatureImage: {
        width: 100,
        height: 40,
        objectFit: 'contain',
        marginBottom: 5,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 8,
        color: '#999999',
        borderTop: '1px solid #EEEEEE',
        paddingTop: 10,
    }
})

interface LeasePDFProps {
    data: {
        leaseDocument: any
        property: any
        landlord: any
        tenant: any
        leaseTerms: any
        tenantSignature?: string | null
        landlordSignature?: string | null
        signedAt?: string | null
    }
}

export function LeasePDF({ data }: LeasePDFProps) {
    const { leaseDocument, property, landlord, tenant, leaseTerms, tenantSignature, landlordSignature, signedAt } = data

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{leaseDocument.title || 'Residential Lease Agreement'}</Text>
                    <Text style={styles.headerSubtitle}>Republic of Namibia</Text>
                </View>

                {/* Property & Terms */}
                <View style={styles.section}>
                    <View style={styles.row}>
                        <View style={styles.col}>
                            <Text style={styles.label}>Property</Text>
                            <Text style={styles.value}>{property.title}</Text>
                            <Text style={{ fontSize: 9, color: '#444' }}>{property.address}</Text>
                            <Text style={{ fontSize: 9, color: '#444' }}>{property.city}</Text>
                        </View>
                        <View style={styles.col}>
                            <Text style={styles.label}>Lease Period</Text>
                            <Text style={styles.value}>
                                {format(new Date(leaseTerms.startDate), 'MMM d, yyyy')} - {format(new Date(leaseTerms.endDate), 'MMM d, yyyy')}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.row}>
                        <View style={styles.col}>
                            <Text style={styles.label}>Monthly Rent</Text>
                            <Text style={styles.value}>N$ {leaseTerms.monthlyRent?.toLocaleString()}</Text>
                        </View>
                        <View style={styles.col}>
                            <Text style={styles.label}>Security Deposit</Text>
                            <Text style={styles.value}>N$ {leaseTerms.deposit?.toLocaleString()}</Text>
                        </View>
                    </View>
                </View>

                {/* Parties */}
                <View style={styles.section}>
                    <View style={styles.row}>
                        <View style={styles.col}>
                            <Text style={styles.label}>Landlord</Text>
                            <Text style={styles.value}>{landlord.fullName}</Text>
                            <Text style={{ fontSize: 9 }}>{landlord.email}</Text>
                            <Text style={{ fontSize: 9 }}>{landlord.phone}</Text>
                        </View>
                        <View style={styles.col}>
                            <Text style={styles.label}>Tenant</Text>
                            <Text style={styles.value}>{tenant?.fullName || 'Not assigned'}</Text>
                            <Text style={{ fontSize: 9 }}>{tenant?.email}</Text>
                            <Text style={{ fontSize: 9 }}>{tenant?.phone}</Text>
                        </View>
                    </View>
                </View>

                {/* Terms */}
                <Text style={styles.sectionTitle}>Terms and Conditions</Text>
                {leaseDocument.clauses?.map((clause: any, index: number) => (
                    <View key={index} style={styles.clause}>
                        <Text style={styles.clauseTitle}>{index + 1}. {clause.title}</Text>
                        <Text style={styles.clauseContent}>{clause.content}</Text>
                    </View>
                ))}

                {/* Rules */}
                <View style={[styles.section, { marginTop: 10 }]}>
                    <Text style={styles.sectionTitle}>Property Policies</Text>
                    <View style={styles.row}>
                        <View style={styles.col}>
                            <Text style={styles.label}>Pets</Text>
                            <Text style={styles.value}>{leaseDocument.petPolicy?.replace('_', ' ') || 'Not Ispecified'}</Text>
                        </View>
                        <View style={styles.col}>
                            <Text style={styles.label}>Maintenance</Text>
                            <Text style={styles.value}>{leaseDocument.maintenanceResponsibility}</Text>
                        </View>
                    </View>
                    <View style={styles.row}>
                        <View style={styles.col}>
                            <Text style={styles.label}>Utilities Included</Text>
                            <Text style={styles.value}>
                                {leaseDocument.utilitiesIncluded?.length ? leaseDocument.utilitiesIncluded.join(', ') : 'None'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Signatures */}
                <View style={styles.signatureSection}>
                    <View style={styles.signatureBox}>
                        {landlordSignature && (
                            <Image src={landlordSignature} style={styles.signatureImage} />
                        )}
                        <Text style={styles.label}>Landlord Signature</Text>
                        <Text style={styles.value}>{landlord.fullName}</Text>
                    </View>
                    <View style={styles.signatureBox}>
                        {tenantSignature && (
                            <Image src={tenantSignature} style={styles.signatureImage} />
                        )}
                        <Text style={styles.label}>Tenant Signature</Text>
                        <Text style={styles.value}>{tenant?.fullName}</Text>
                        {signedAt && (
                            <Text style={{ fontSize: 8, color: '#999' }}>Signed: {format(new Date(signedAt), 'MMM d, yyyy')}</Text>
                        )}
                    </View>
                </View>

                <Text style={styles.footer}>
                    Generated via LINK Property Platform • Legally binding upon signature
                </Text>
            </Page>
        </Document>
    )
}
