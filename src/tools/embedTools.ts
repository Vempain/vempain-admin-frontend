/**
 * Utility functions for parsing and rendering Vempain embed tags.
 *
 * Supported embed tag formats:
 *   <!--vps:embed:gallery:%d-->
 *   <!--vps:embed:image:%d-->
 *   <!--vps:embed:hero:%d-->
 *   <!--vps:embed:collapse:<url-encoded-json>-->
 *   <!--vps:embed:carousel:<url-encoded-json>:autoplay:dotDuration:speed-->
 *
 * The JSON payload for collapse/carousel is URL-encoded to prevent `-->` in
 * user-provided text from prematurely terminating the HTML comment.
 */

export type EmbedType = 'gallery' | 'image' | 'hero' | 'collapse' | 'carousel';

export interface CollapseCarouselItem {
    title: string;
    body: string;
}

/**
 * Discriminated union so TypeScript consumers get correct types for each embed.
 * gallery/image/hero use a numeric `id`; collapse/carousel carry inline `items`.
 */
export type EmbedDescriptor =
    | { type: 'gallery'; id: number; extra?: string }
    | { type: 'image'; id: number; extra?: string }
    | { type: 'hero'; id: number; extra?: string }
    | { type: 'collapse'; items: CollapseCarouselItem[] }
    | { type: 'carousel'; items: CollapseCarouselItem[]; extra?: string };

export interface CarouselParams {
    autoplay: boolean;
    dotDuration: boolean;
    speed: number;
}

// Matches any embed tag: <!--vps:embed:<type>:<content>-->
// content may be a numeric id, a URL-encoded JSON array, or a URL-encoded JSON
// array followed by carousel params
const EMBED_REGEX = /<!--vps:embed:([a-z]+):(.*?)-->/g;

/**
 * Escape a string for safe use inside an HTML attribute value (double-quoted).
 */
function escapeAttr(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Parse a carousel extra-params string into structured params.
 * Format: "<autoplay>:<dotDuration>:<speed>"
 */
export function parseCarouselParams(extra: string): CarouselParams {
    const parts = extra.split(':');
    return {
        autoplay: parts[0] === 'true',
        dotDuration: parts[1] === 'true',
        speed: parts[2] ? parseInt(parts[2], 10) : 500,
    };
}

/**
 * Build a carousel embed tag from a list of items and carousel params.
 * The JSON payload is URL-encoded to prevent `-->` in text from breaking the HTML comment.
 */
export function buildCarouselTag(items: CollapseCarouselItem[], params: CarouselParams): string {
    const encoded = encodeURIComponent(JSON.stringify(items));
    return `<!--vps:embed:carousel:${encoded}:${params.autoplay}:${params.dotDuration}:${params.speed}-->`;
}

/**
 * Build an embed tag string from an EmbedDescriptor.
 */
export function buildEmbedTag(descriptor: EmbedDescriptor): string {
    if (descriptor.type === 'collapse') {
        return `<!--vps:embed:collapse:${encodeURIComponent(JSON.stringify(descriptor.items))}-->`;
    }
    if (descriptor.type === 'carousel') {
        const extra = descriptor.extra ? `:${descriptor.extra}` : '';
        return `<!--vps:embed:carousel:${encodeURIComponent(JSON.stringify(descriptor.items))}${extra}-->`;
    }
    // gallery, image, hero — numeric ID based
    if (descriptor.extra) {
        return `<!--vps:embed:${descriptor.type}:${descriptor.id}:${descriptor.extra}-->`;
    }
    return `<!--vps:embed:${descriptor.type}:${descriptor.id}-->`;
}

/**
 * Split an HTML string into a sequence of plain-HTML segments and embed descriptors.
 * Returns an array where each element is either:
 *   - { kind: 'html', content: string }
 *   - { kind: 'embed', descriptor: EmbedDescriptor }
 */
export type ContentSegment =
    | { kind: 'html'; content: string }
    | { kind: 'embed'; descriptor: EmbedDescriptor };

/**
 * Decode URL-encoded JSON for collapse/carousel embed content.
 * Handles both new (URL-encoded) and legacy (plain) format.
 */
function decodeEmbedJson(raw: string): string {
    try {
        return decodeURIComponent(raw);
    } catch {
        return raw; // already plain text or malformed encoding
    }
}

/**
 * Parse the raw content string (everything after the type colon) into an EmbedDescriptor.
 * Supports both:
 *   - New format: URL-encoded JSON array for collapse/carousel
 *   - Legacy format: numeric id (optionally followed by extra params)
 */
function parseEmbedContent(type: EmbedType, raw: string): EmbedDescriptor {
    if (type === 'collapse' || type === 'carousel') {
        const decoded = decodeEmbedJson(raw);

        if (decoded.startsWith('[')) {
            const jsonEnd = decoded.lastIndexOf(']');
            if (jsonEnd !== -1) {
                const jsonStr = decoded.substring(0, jsonEnd + 1);
                const rest = decoded.substring(jsonEnd + 1);
                let items: CollapseCarouselItem[] = [];
                try {
                    const parsed = JSON.parse(jsonStr);
                    if (Array.isArray(parsed)) {
                        items = parsed as CollapseCarouselItem[];
                    }
                } catch {
                    // malformed JSON — treat as empty items list
                }
                if (type === 'collapse') {
                    return {type, items};
                }
                const extra = rest.startsWith(':') ? rest.substring(1) : undefined;
                return extra ? {type, items, extra} : {type, items};
            }
        }

        // Legacy numeric format (e.g. <!--vps:embed:collapse:30-->)
        // Return with empty items array
        if (type === 'collapse') {
            return {type, items: []};
        }
        // Legacy numeric carousel: try to preserve the extra params
        const firstColon = raw.indexOf(':');
        const extra = firstColon !== -1 ? raw.substring(firstColon + 1) : undefined;
        return extra ? {type, items: [], extra} : {type, items: []};
    }

    // Numeric-ID format: used for gallery, image, hero
    const firstColon = raw.indexOf(':');
    const idStr = firstColon === -1 ? raw : raw.substring(0, firstColon);
    const extra = firstColon === -1 ? undefined : raw.substring(firstColon + 1);
    const id = parseInt(idStr, 10);
    // Always include extra (undefined when absent) to preserve the original descriptor shape.
    // Use explicit type narrowing to avoid casting the discriminated union.
    if (type === 'gallery') return {type, id, extra};
    if (type === 'image') return {type, id, extra};
    return {type: 'hero', id, extra};
}

export function parseEmbeds(html: string): ContentSegment[] {
    const segments: ContentSegment[] = [];
    let lastIndex = 0;
    const regex = new RegExp(EMBED_REGEX.source, 'g');
    let match: RegExpExecArray | null;

    while ((match = regex.exec(html)) !== null) {
        if (match.index > lastIndex) {
            segments.push({kind: 'html', content: html.slice(lastIndex, match.index)});
        }

        const type = match[1] as EmbedType;
        const content = match[2];

        segments.push({
            kind: 'embed',
            descriptor: parseEmbedContent(type, content),
        });

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < html.length) {
        segments.push({kind: 'html', content: html.slice(lastIndex)});
    }

    return segments;
}

/**
 * Convert embed comment tags in HTML to visual placeholder spans
 * for display in the rich text editor (WYSIWYG mode).
 *
 * For gallery/image/hero the placeholder stores data-id and data-extra (HTML-escaped).
 * For collapse/carousel the placeholder stores data-content with the raw URL-encoded
 * embed tag content (safe in HTML attributes, no further encoding needed).
 */
export function convertTagsToPlaceholders(html: string): string {
    return html.replace(new RegExp(EMBED_REGEX.source, 'g'), (_match, type, content) => {
        const embedType = type as EmbedType;
        let dataAttrs: string;

        if (embedType === 'collapse' || embedType === 'carousel') {
            // content is already URL-encoded JSON (or legacy numeric).
            // URL-encoded strings only contain safe chars (%XX, alphanumeric, - _ . ! ~ * ' ( ))
            // so they are safe to embed directly in an HTML attribute without further encoding.
            dataAttrs = `data-type="${escapeAttr(type)}" data-content="${content}"`;
        } else {
            // gallery / image / hero: split numeric id from optional extra params
            const firstColon = content.indexOf(':');
            const id = firstColon === -1 ? content : content.substring(0, firstColon);
            const extra = firstColon === -1 ? '' : content.substring(firstColon + 1);
            // Escape attribute values to prevent attribute injection
            dataAttrs = `data-type="${escapeAttr(type)}" data-id="${escapeAttr(id)}" data-extra="${escapeAttr(extra)}"`;
        }

        const label = buildPlaceholderLabel(embedType, content);
        return (
            `<span class="vps-embed-placeholder" ` +
            `${dataAttrs} ` +
            `contenteditable="false" ` +
            `style="display:inline-block;background:#1a3a5c;border:1px solid #4a90d9;` +
            `border-radius:4px;padding:2px 8px;margin:2px 4px;cursor:pointer;` +
            `user-select:none;color:#90c4f8;font-size:0.85em;white-space:nowrap;"` +
            `>${label}</span>`
        );
    });
}

function buildPlaceholderLabel(type: EmbedType, content: string): string {
    switch (type) {
        case 'gallery':
            return `🖼 gallery:${content}`;
        case 'image':
            return `🖼 image:${content}`;
        case 'hero':
            return `🎨 hero:${content}`;
        case 'collapse': {
            const decoded = decodeEmbedJson(content);
            try {
                const parsed = JSON.parse(decoded);
                if (Array.isArray(parsed)) {
                    const count = parsed.length;
                    return `📂 collapse (${count} item${count !== 1 ? 's' : ''})`;
                }
            } catch { /* ignore */ }
            return `📂 collapse:${content}`;
        }
        case 'carousel': {
            const decoded = decodeEmbedJson(content);
            try {
                const jsonEnd = decoded.lastIndexOf(']');
                if (jsonEnd !== -1) {
                    const parsed = JSON.parse(decoded.substring(0, jsonEnd + 1));
                    if (Array.isArray(parsed)) {
                        const count = parsed.length;
                        const rest = decoded.substring(jsonEnd + 1);
                        const extra = rest.startsWith(':') ? rest.substring(1) : '';
                        const params = extra ? parseCarouselParams(extra) : null;
                        const speedInfo = params ? ` speed:${params.speed}ms` : '';
                        return `🎠 carousel (${count} item${count !== 1 ? 's' : ''})${speedInfo}`;
                    }
                }
            } catch { /* ignore */ }
            return `🎠 carousel:${content}`;
        }
        default:
            return `embed:${content}`;
    }
}

/**
 * Convert visual placeholder spans back to embed comment tags.
 * Inverse of convertTagsToPlaceholders.
 */
export function convertPlaceholdersToTags(html: string): string {
    // Handle collapse/carousel placeholders that use data-content.
    // The stored value is the raw embed tag content (URL-encoded JSON) — put it back as-is.
    let result = html.replace(
        /<span[^>]+class="vps-embed-placeholder"[^>]+data-type="([^"]+)"[^>]+data-content="([^"]*)"[^>]*>.*?<\/span>/g,
        (_match, type, rawContent) => {
            return `<!--vps:embed:${type}:${rawContent}-->`;
        },
    );
    // Handle gallery/image/hero placeholders that use data-id and data-extra
    result = result.replace(
        /<span[^>]+class="vps-embed-placeholder"[^>]+data-type="([^"]+)"[^>]+data-id="([^"]+)"[^>]+data-extra="([^"]*)"[^>]*>.*?<\/span>/g,
        (_match, type, id, extra) => {
            if (extra) {
                return `<!--vps:embed:${type}:${id}:${extra}-->`;
            }
            return `<!--vps:embed:${type}:${id}-->`;
        },
    );
    return result;
}
