/**
 * Utility functions for parsing and rendering Vempain embed tags.
 *
 * Supported embed tag formats:
 *   <!--vps:embed:gallery:%d-->
 *   <!--vps:embed:image:%d-->
 *   <!--vps:embed:hero:%d-->
 *   <!--vps:embed:collapse:[{"title":"...","body":"..."},...]-->
 *   <!--vps:embed:carousel:[{"title":"...","body":"..."},...]:autoplay:dotDuration:speed-->
 */

export type EmbedType = 'gallery' | 'image' | 'hero' | 'collapse' | 'carousel';

export interface CollapseCarouselItem {
    title: string;
    body: string;
}

export interface EmbedDescriptor {
    type: EmbedType;
    /** Numeric ID — used for gallery, image and hero embed types */
    id?: number;
    /** JSON items — used for collapse and carousel embed types */
    items?: CollapseCarouselItem[];
    /** Extra parameters string (for carousel: "autoplay:dotDuration:speed") */
    extra?: string;
}

export interface CarouselParams {
    autoplay: boolean;
    dotDuration: boolean;
    speed: number;
}

// Matches any embed tag: <!--vps:embed:<type>:<content>-->
// content may be a numeric id, a JSON array, or a JSON array followed by carousel params
const EMBED_REGEX = /<!--vps:embed:([a-z]+):(.*?)-->/g;

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
 */
export function buildCarouselTag(items: CollapseCarouselItem[], params: CarouselParams): string {
    return `<!--vps:embed:carousel:${JSON.stringify(items)}:${params.autoplay}:${params.dotDuration}:${params.speed}-->`;
}

/**
 * Build an embed tag string from an EmbedDescriptor.
 */
export function buildEmbedTag(descriptor: EmbedDescriptor): string {
    if (descriptor.type === 'collapse' && descriptor.items) {
        return `<!--vps:embed:collapse:${JSON.stringify(descriptor.items)}-->`;
    }
    if (descriptor.type === 'carousel' && descriptor.items) {
        const extra = descriptor.extra ? `:${descriptor.extra}` : '';
        return `<!--vps:embed:carousel:${JSON.stringify(descriptor.items)}${extra}-->`;
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
 * Parse the raw content string (everything after the type colon) into
 * the relevant EmbedDescriptor fields based on the embed type.
 */
function parseEmbedContent(type: EmbedType, content: string): Omit<EmbedDescriptor, 'type'> {
    if ((type === 'collapse' || type === 'carousel') && content.startsWith('[')) {
        const jsonEnd = content.lastIndexOf(']');
        if (jsonEnd === -1) {
            return {items: []};
        }
        const jsonStr = content.substring(0, jsonEnd + 1);
        const rest = content.substring(jsonEnd + 1);
        let items: CollapseCarouselItem[] = [];
        try {
            items = JSON.parse(jsonStr) as CollapseCarouselItem[];
        } catch {
            // malformed JSON — treat as empty items list
        }
        const extra = rest.startsWith(':') ? rest.substring(1) : undefined;
        return {items, ...(extra ? {extra} : {})};
    }
    // Numeric-ID format: used for gallery, image, hero (and old-format collapse/carousel)
    const firstColon = content.indexOf(':');
    if (firstColon === -1) {
        return {id: parseInt(content, 10)};
    }
    return {id: parseInt(content.substring(0, firstColon), 10), extra: content.substring(firstColon + 1)};
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
            descriptor: {type, ...parseEmbedContent(type, content)},
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
 * For gallery/image/hero the placeholder stores data-id and data-extra.
 * For collapse/carousel the placeholder stores data-content (URL-encoded raw content).
 */
export function convertTagsToPlaceholders(html: string): string {
    return html.replace(new RegExp(EMBED_REGEX.source, 'g'), (_match, type, content) => {
        const embedType = type as EmbedType;
        let dataAttrs: string;

        if (embedType === 'collapse' || embedType === 'carousel') {
            // Store URL-encoded content so the full JSON (and carousel params) can be restored
            dataAttrs = `data-type="${type}" data-content="${encodeURIComponent(content)}"`;
        } else {
            // gallery / image / hero: split numeric id from optional extra params
            const firstColon = content.indexOf(':');
            const id = firstColon === -1 ? content : content.substring(0, firstColon);
            const extra = firstColon === -1 ? '' : content.substring(firstColon + 1);
            dataAttrs = `data-type="${type}" data-id="${id}" data-extra="${extra}"`;
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
            try {
                const items = JSON.parse(content) as CollapseCarouselItem[];
                const count = items.length;
                return `📂 collapse (${count} item${count !== 1 ? 's' : ''})`;
            } catch {
                return `📂 collapse:${content}`;
            }
        }
        case 'carousel': {
            try {
                const jsonEnd = content.lastIndexOf(']');
                const jsonStr = content.substring(0, jsonEnd + 1);
                const rest = content.substring(jsonEnd + 1);
                const items = JSON.parse(jsonStr) as CollapseCarouselItem[];
                const count = items.length;
                const extra = rest.startsWith(':') ? rest.substring(1) : '';
                const params = extra ? parseCarouselParams(extra) : null;
                const speedInfo = params ? ` speed:${params.speed}ms` : '';
                return `🎠 carousel (${count} item${count !== 1 ? 's' : ''})${speedInfo}`;
            } catch {
                return `🎠 carousel:${content}`;
            }
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
    // Handle collapse/carousel placeholders that use data-content
    let result = html.replace(
        /<span[^>]+class="vps-embed-placeholder"[^>]+data-type="([^"]+)"[^>]+data-content="([^"]*)"[^>]*>.*?<\/span>/g,
        (_match, type, encodedContent) => {
            return `<!--vps:embed:${type}:${decodeURIComponent(encodedContent)}-->`;
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
