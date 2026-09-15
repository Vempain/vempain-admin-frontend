import DOMPurify from "dompurify";
import {buildCarouselTag, buildEmbedTag, type CollapseCarouselItem, type EmbedDescriptor, parseCarouselParams, parseEmbeds} from "./embedTools";
import {normalizeYoutubeEmbedUrl} from "./urlSecurity";

const RICH_TEXT_SANITIZE_CONFIG = {
    FORBID_TAGS: ["base", "embed", "form", "iframe", "input", "link", "meta", "object", "script", "style", "svg"],
    ALLOW_DATA_ATTR: false,
};

function sanitizeHtml(value: string): string {
    return DOMPurify.sanitize(value, RICH_TEXT_SANITIZE_CONFIG);
}

export function sanitizeHtmlFragment(value: unknown): string {
    return typeof value === "string" ? sanitizeHtml(value) : "";
}

function sanitizeItems(items: CollapseCarouselItem[]): CollapseCarouselItem[] {
    return items
        .filter((item) => typeof item?.title === "string" && typeof item?.body === "string")
        .map((item) => ({
            title: item.title,
            body: sanitizeHtml(item.body),
        }));
}

function safeEmbedTag(descriptor: EmbedDescriptor): string {
    switch (descriptor.type) {
        case "youtube": {
            const url = normalizeYoutubeEmbedUrl(descriptor.url);
            return url ? buildEmbedTag({type: "youtube", url}) : "";
        }
        case "music":
        case "gps_timeseries":
            return /^[A-Za-z0-9][A-Za-z0-9_.-]{0,199}$/.test(descriptor.identifier)
                ? buildEmbedTag(descriptor)
                : "";
        case "collapse":
            return buildEmbedTag({type: "collapse", items: sanitizeItems(descriptor.items)});
        case "carousel": {
            const params = descriptor.extra
                ? parseCarouselParams(descriptor.extra)
                : {autoplay: false, dotDuration: false, speed: 500};
            return buildCarouselTag(sanitizeItems(descriptor.items), params);
        }
        case "last":
            return buildEmbedTag(descriptor);
        case "gallery":
        case "image":
        case "hero":
        case "video":
        case "audio":
            return Number.isInteger(descriptor.id) && descriptor.id > 0
                ? buildEmbedTag({type: descriptor.type, id: descriptor.id})
                : "";
    }
}

/**
 * Sanitize HTML while preserving only canonical, known Vempain embed tags.
 * The rich-text editor turns these comments into HTML placeholders, so
 * untrusted embed values must be validated before they reach it.
 */
export function sanitizeRichText(value: unknown): string {
    if (typeof value !== "string") {
        return "";
    }

    return parseEmbeds(value)
        .map((segment) => segment.kind === "html"
            ? sanitizeHtml(segment.content)
            : safeEmbedTag(segment.descriptor))
        .join("");
}
