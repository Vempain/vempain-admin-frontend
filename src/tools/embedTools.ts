/**
 * Utility functions for parsing and rendering Vempain embed tags.
 *
 * Supported embed tag formats:
 *   <!--vps:embed:gallery:%d-->
 *   <!--vps:embed:image:%d-->
 *   <!--vps:embed:hero:%d-->
 *   <!--vps:embed:collapse:%d-->
 *   <!--vps:embed:carousel:%d:<autoplay>:<dotDuration>:<speed>-->
 */

export type EmbedType = 'gallery' | 'image' | 'hero' | 'collapse' | 'carousel';

export interface EmbedDescriptor {
    type: EmbedType;
    id: number;
    /** Extra parameters string after the id (for carousel: "autoplay:dotDuration:speed") */
    extra?: string;
}

export interface CarouselParams {
    autoplay: boolean;
    dotDuration: boolean;
    speed: number;
}

const EMBED_REGEX = /<!--vps:embed:([a-z]+):(\d+)(?::([^-]*))?-->/g;

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
 * Build a carousel embed tag from structured params.
 */
export function buildCarouselTag(id: number, params: CarouselParams): string {
    return `<!--vps:embed:carousel:${id}:${params.autoplay}:${params.dotDuration}:${params.speed}-->`;
}

/**
 * Build an embed tag string from an EmbedDescriptor.
 */
export function buildEmbedTag(descriptor: EmbedDescriptor): string {
    if (descriptor.type === 'carousel' && descriptor.extra) {
        return `<!--vps:embed:carousel:${descriptor.id}:${descriptor.extra}-->`;
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
        const id = parseInt(match[2], 10);
        const extra = match[3];

        segments.push({
            kind: 'embed',
            descriptor: {type, id, extra},
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
 */
export function convertTagsToPlaceholders(html: string): string {
    return html.replace(new RegExp(EMBED_REGEX.source, 'g'), (_match, type, id, extra) => {
        const label = buildPlaceholderLabel(type as EmbedType, parseInt(id, 10), extra);
        return (
            `<span class="vps-embed-placeholder" ` +
            `data-type="${type}" data-id="${id}" data-extra="${extra ?? ''}" ` +
            `contenteditable="false" ` +
            `style="display:inline-block;background:#1a3a5c;border:1px solid #4a90d9;` +
            `border-radius:4px;padding:2px 8px;margin:2px 4px;cursor:pointer;` +
            `user-select:none;color:#90c4f8;font-size:0.85em;white-space:nowrap;"` +
            `>${label}</span>`
        );
    });
}

function buildPlaceholderLabel(type: EmbedType, id: number, extra?: string): string {
    switch (type) {
        case 'gallery':
            return `🖼 gallery:${id}`;
        case 'image':
            return `🖼 image:${id}`;
        case 'hero':
            return `🎨 hero:${id}`;
        case 'collapse':
            return `📂 collapse:${id}`;
        case 'carousel': {
            const params = extra ? parseCarouselParams(extra) : null;
            return params
                ? `🎠 carousel:${id} [autoplay:${params.autoplay} speed:${params.speed}ms]`
                : `🎠 carousel:${id}`;
        }
        default:
            return `embed:${id}`;
    }
}

/**
 * Convert visual placeholder spans back to embed comment tags.
 * Inverse of convertTagsToPlaceholders.
 */
export function convertPlaceholdersToTags(html: string): string {
    return html.replace(
        /<span[^>]+class="vps-embed-placeholder"[^>]+data-type="([^"]+)"[^>]+data-id="([^"]+)"[^>]+data-extra="([^"]*)"[^>]*>.*?<\/span>/g,
        (_match, type, id, extra) => {
            if (extra) {
                return `<!--vps:embed:${type}:${id}:${extra}-->`;
            }
            return `<!--vps:embed:${type}:${id}-->`;
        },
    );
}
