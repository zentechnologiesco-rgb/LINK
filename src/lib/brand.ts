type CssVariables = Record<string, string>

export const brandPalette = {
  black: "#000000",
  white: "#FFFFFF",
  baseBlue: "#0000FF",
  red: "#FC401F",
  cerulean: "#3C8AFF",
  yellow: "#FFD12F",
  pink: "#FEA8CD",
  green: "#66C800",
  lime: "#B6F569",
  gray0: "#FFFFFF",
  gray10: "#EEF0F3",
  gray50: "#717886",
  gray60: "#5B616E",
  gray80: "#32353D",
  gray100: "#0A0B0D",
} as const

export const brandMeta = {
  backgroundColor: brandPalette.white,
  themeColor: brandPalette.baseBlue,
} as const

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "")
  const expanded = normalized.length === 3
    ? normalized.split("").map((char) => `${char}${char}`).join("")
    : normalized

  const value = Number.parseInt(expanded, 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255

  return { r, g, b }
}

function rgbTriplet(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  return `${r} ${g} ${b}`
}

function rgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function cssBlock(selector: string, variables: CssVariables) {
  const declarations = Object.entries(variables)
    .map(([key, value]) => `${key}: ${value};`)
    .join("")

  return `${selector}{${declarations}}`
}

const sharedVariables: CssVariables = {
  "--brand-black": brandPalette.black,
  "--brand-white": brandPalette.white,
  "--brand-base-blue": brandPalette.baseBlue,
  "--brand-red": brandPalette.red,
  "--brand-cerulean": brandPalette.cerulean,
  "--brand-yellow": brandPalette.yellow,
  "--brand-pink": brandPalette.pink,
  "--brand-green": brandPalette.green,
  "--brand-lime": brandPalette.lime,
  "--brand-gray-0": brandPalette.gray0,
  "--brand-gray-10": brandPalette.gray10,
  "--brand-gray-50": brandPalette.gray50,
  "--brand-gray-60": brandPalette.gray60,
  "--brand-gray-80": brandPalette.gray80,
  "--brand-gray-100": brandPalette.gray100,
  "--brand-base-blue-rgb": rgbTriplet(brandPalette.baseBlue),
  "--brand-cerulean-rgb": rgbTriplet(brandPalette.cerulean),
  "--brand-red-rgb": rgbTriplet(brandPalette.red),
  "--brand-green-rgb": rgbTriplet(brandPalette.green),
  "--brand-surface-canvas": brandPalette.gray0,
  "--brand-surface-muted": `color-mix(in srgb, ${brandPalette.gray10} 70%, ${brandPalette.white})`,
  "--brand-surface-soft": brandPalette.gray10,
  "--brand-surface-highlight": `color-mix(in srgb, ${brandPalette.cerulean} 12%, ${brandPalette.white})`,
  "--brand-line-soft": `color-mix(in srgb, ${brandPalette.gray10} 76%, ${brandPalette.gray50})`,
  "--brand-line-strong": `color-mix(in srgb, ${brandPalette.gray60} 42%, ${brandPalette.white})`,
  "--brand-ink-soft": brandPalette.gray60,
  "--brand-ink-subtle": brandPalette.gray50,
  "--brand-shadow": rgba(brandPalette.baseBlue, 0.16),
  "--brand-shadow-strong": rgba(brandPalette.baseBlue, 0.28),
  "--brand-gradient-hero": `linear-gradient(135deg, ${brandPalette.baseBlue} 0%, ${brandPalette.cerulean} 54%, color-mix(in srgb, ${brandPalette.pink} 72%, ${brandPalette.baseBlue}) 100%)`,
  "--brand-gradient-soft": `linear-gradient(180deg, color-mix(in srgb, ${brandPalette.baseBlue} 8%, ${brandPalette.white}) 0%, ${brandPalette.white} 100%)`,
}

const lightThemeVariables: CssVariables = {
  "--background": "var(--brand-surface-canvas)",
  "--foreground": "var(--brand-gray-100)",
  "--card": "var(--brand-white)",
  "--card-foreground": "var(--brand-gray-100)",
  "--popover": "var(--brand-white)",
  "--popover-foreground": "var(--brand-gray-100)",
  "--primary": "var(--brand-base-blue)",
  "--primary-foreground": "var(--brand-white)",
  "--secondary": "var(--brand-surface-soft)",
  "--secondary-foreground": "var(--brand-gray-100)",
  "--muted": "var(--brand-surface-muted)",
  "--muted-foreground": "var(--brand-gray-60)",
  "--accent": "var(--brand-surface-highlight)",
  "--accent-foreground": "var(--brand-gray-100)",
  "--destructive": "var(--brand-red)",
  "--border": "var(--brand-line-soft)",
  "--input": "var(--brand-line-soft)",
  "--ring": "var(--brand-lime)",
  "--chart-1": "var(--brand-base-blue)",
  "--chart-2": "var(--brand-cerulean)",
  "--chart-3": "var(--brand-pink)",
  "--chart-4": "var(--brand-yellow)",
  "--chart-5": "var(--brand-green)",
  "--sidebar": "var(--brand-white)",
  "--sidebar-foreground": "var(--brand-gray-100)",
  "--sidebar-primary": "var(--brand-base-blue)",
  "--sidebar-primary-foreground": "var(--brand-white)",
  "--sidebar-accent": "var(--brand-surface-highlight)",
  "--sidebar-accent-foreground": "var(--brand-gray-100)",
  "--sidebar-border": "var(--brand-line-soft)",
  "--sidebar-ring": "var(--brand-lime)",
  "--card-border": rgba(brandPalette.baseBlue, 0.08),
  "--card-hover-border": rgba(brandPalette.baseBlue, 0.18),
  "--surface-elevated": "var(--brand-white)",
  "--surface-hover": "var(--brand-surface-highlight)",
  "--category-active": "var(--brand-base-blue)",
  "--category-inactive": "var(--brand-gray-50)",
  "--category-border": "var(--brand-line-soft)",
}

const darkThemeVariables: CssVariables = {
  "--background": "var(--brand-gray-100)",
  "--foreground": "var(--brand-white)",
  "--card": "var(--brand-gray-80)",
  "--card-foreground": "var(--brand-white)",
  "--popover": "var(--brand-gray-80)",
  "--popover-foreground": "var(--brand-white)",
  "--primary": "var(--brand-cerulean)",
  "--primary-foreground": "var(--brand-gray-100)",
  "--secondary": "color-mix(in srgb, var(--brand-gray-80) 84%, var(--brand-black))",
  "--secondary-foreground": "var(--brand-white)",
  "--muted": "color-mix(in srgb, var(--brand-gray-80) 80%, var(--brand-black))",
  "--muted-foreground": "var(--brand-gray-10)",
  "--accent": "color-mix(in srgb, var(--brand-cerulean) 20%, var(--brand-gray-80))",
  "--accent-foreground": "var(--brand-white)",
  "--destructive": "var(--brand-red)",
  "--border": "color-mix(in srgb, var(--brand-gray-60) 36%, transparent)",
  "--input": "color-mix(in srgb, var(--brand-gray-60) 52%, transparent)",
  "--ring": "var(--brand-lime)",
  "--chart-1": "var(--brand-cerulean)",
  "--chart-2": "var(--brand-green)",
  "--chart-3": "var(--brand-yellow)",
  "--chart-4": "var(--brand-pink)",
  "--chart-5": "var(--brand-red)",
  "--sidebar": "var(--brand-gray-80)",
  "--sidebar-foreground": "var(--brand-white)",
  "--sidebar-primary": "var(--brand-cerulean)",
  "--sidebar-primary-foreground": "var(--brand-gray-100)",
  "--sidebar-accent": "color-mix(in srgb, var(--brand-cerulean) 18%, var(--brand-gray-80))",
  "--sidebar-accent-foreground": "var(--brand-white)",
  "--sidebar-border": "color-mix(in srgb, var(--brand-gray-60) 36%, transparent)",
  "--sidebar-ring": "var(--brand-lime)",
}

export function createBrandThemeCss() {
  return [
    cssBlock(":root", {
      ...sharedVariables,
      ...lightThemeVariables,
    }),
    cssBlock(".dark", darkThemeVariables),
  ].join("")
}

// Tan was mentioned in the brief, but no tan hex value was supplied yet.
