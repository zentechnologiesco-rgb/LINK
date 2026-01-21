/**
 * Namibian location constants
 */

export const NAMIBIAN_CITIES = [
    'Windhoek',
    'Swakopmund',
    'Walvis Bay',
    'Oshakati',
    'Rundu',
    'Katima Mulilo',
    'Otjiwarongo',
    'Keetmanshoop',
    'Ondangwa',
    'Okahandja',
    'Rehoboth',
    'Mariental',
    'Gobabis',
    'Tsumeb',
    'Outjo',
    'Henties Bay',
    'Eenhana',
    'Grootfontein',
    'Luderitz',
    'Karibib',
] as const

export type NamibianCity = (typeof NAMIBIAN_CITIES)[number]

export const NAMIBIAN_REGIONS = [
    'Erongo',
    'Hardap',
    'Karas',
    'Kavango East',
    'Kavango West',
    'Khomas',
    'Kunene',
    'Ohangwena',
    'Omaheke',
    'Omusati',
    'Oshana',
    'Oshikoto',
    'Otjozondjupa',
    'Zambezi',
] as const

export type NamibianRegion = (typeof NAMIBIAN_REGIONS)[number]

/**
 * Popular Windhoek suburbs
 */
export const WINDHOEK_SUBURBS = [
    'Klein Windhoek',
    'Ludwigsdorf',
    'Eros',
    'Olympia',
    'Avis',
    'Pioneers Park',
    'Academia',
    'Hochland Park',
    'Rocky Crest',
    'Kleine Kuppe',
    'Khomasdal',
    'Katutura',
    'Windhoek Central',
    'Ausspannplatz',
    'Windhoek West',
    'Windhoek North',
    'Suiderhof',
    'Prosperita',
    'Cimbebasia',
    'Dorado Park',
] as const

export type WindhoekSuburb = (typeof WINDHOEK_SUBURBS)[number]

/**
 * Currency formatting for Namibian Dollar
 */
export const CURRENCY_FORMAT = {
    locale: 'en-NA',
    currency: 'NAD',
    symbol: 'N$',
}

/**
 * Helper to format currency in NAD
 */
export function formatNAD(amount: number): string {
    return new Intl.NumberFormat(CURRENCY_FORMAT.locale, {
        style: 'currency',
        currency: CURRENCY_FORMAT.currency,
        minimumFractionDigits: 0,
    }).format(amount)
}
