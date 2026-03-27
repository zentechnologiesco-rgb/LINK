import type { Doc } from "../_generated/dataModel";

type NormalizeTextOptions = {
    maxLength: number;
    multiline?: boolean;
};

function stripControlCharacters(value: string) {
    return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

export function normalizeText(value: string, options: NormalizeTextOptions) {
    const normalizedLineEndings = stripControlCharacters(value).replace(/\r\n?/g, "\n");
    const trimmedValue = options.multiline
        ? normalizedLineEndings.trim()
        : normalizedLineEndings.replace(/\s+/g, " ").trim();

    return trimmedValue.slice(0, options.maxLength);
}

export function normalizeOptionalText(
    value: string | null | undefined,
    options: NormalizeTextOptions,
) {
    if (!value) return undefined;

    const normalized = normalizeText(value, options);
    return normalized || undefined;
}

export function normalizeRequiredText(
    value: string | null | undefined,
    options: NormalizeTextOptions,
    fieldLabel = "This field",
) {
    const normalized = normalizeOptionalText(value, options);
    if (!normalized) {
        throw new Error(`${fieldLabel} is required`);
    }

    return normalized;
}

export function normalizeStringList(
    values: string[] | null | undefined,
    options: NormalizeTextOptions,
) {
    if (!values || values.length === 0) return [] as string[];

    const normalizedValues = values
        .map((value) => normalizeOptionalText(value, options))
        .filter((value): value is string => Boolean(value));

    return Array.from(new Set(normalizedValues));
}

export function getPropertyPublicationStatus(
    property: Pick<Doc<"properties">, "publicationStatus" | "isAvailable">,
) {
    return property.publicationStatus ?? (property.isAvailable ? "published" : "unpublished");
}

export function isPropertyPubliclyVisible(
    property: Pick<Doc<"properties">, "approvalStatus" | "publicationStatus" | "isAvailable">,
) {
    return property.approvalStatus === "approved" && getPropertyPublicationStatus(property) === "published";
}

export function isSafeExternalOrRelativeUrl(value: string) {
    if (value.startsWith("/") && !value.startsWith("//")) {
        return true;
    }

    try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:";
    } catch {
        return false;
    }
}

export function normalizeSafeLink(value: string | null | undefined) {
    const normalizedValue = normalizeOptionalText(value, {
        maxLength: 2048,
    });

    if (!normalizedValue) return undefined;
    if (!isSafeExternalOrRelativeUrl(normalizedValue)) {
        throw new Error("Only relative links or http(s) URLs are allowed");
    }

    return normalizedValue;
}
