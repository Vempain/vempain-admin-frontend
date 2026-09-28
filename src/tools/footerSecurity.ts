import DOMPurify from "dompurify";

const FOOTER_SANITIZE_CONFIG = {
    ALLOWED_TAGS: ["a", "br"],
    ALLOWED_ATTR: ["href"],
    ALLOW_DATA_ATTR: false,
};

export function sanitizeFooterMarkup(value: string): string {
    return DOMPurify.sanitize(value, FOOTER_SANITIZE_CONFIG);
}
