import {
    buildCarouselTag,
    buildEmbedTag,
    convertPlaceholdersToTags,
    convertTagsToPlaceholders,
    parseCarouselParams,
    parseEmbeds,
} from '../tools/embedTools';

const SAMPLE_ITEMS = [
    {title: 'Title of the first item', body: 'Body of the first item'},
    {title: 'Title of the second item', body: 'Body of the second item'},
];

/** Build the URL-encoded collapse tag as it would appear in stored HTML */
function collapseTag(items: object[]): string {
    return `<!--vps:embed:collapse:${encodeURIComponent(JSON.stringify(items))}-->`;
}

/** Build the URL-encoded carousel tag as it would appear in stored HTML */
function carouselTag(items: object[], extra: string): string {
    return `<!--vps:embed:carousel:${encodeURIComponent(JSON.stringify(items))}:${extra}-->`;
}

describe('parseCarouselParams', () => {
    it('parses all params correctly', () => {
        const result = parseCarouselParams('true:true:800');
        expect(result).toEqual({autoplay: true, dotDuration: true, speed: 800});
    });

    it('parses false values', () => {
        const result = parseCarouselParams('false:false:500');
        expect(result).toEqual({autoplay: false, dotDuration: false, speed: 500});
    });

    it('uses default speed when missing', () => {
        const result = parseCarouselParams('true:false:');
        expect(result.speed).toBe(500);
    });
});

describe('buildEmbedTag', () => {
    it('builds gallery tag', () => {
        expect(buildEmbedTag({type: 'gallery', id: 5})).toBe('<!--vps:embed:gallery:5-->');
    });

    it('builds image tag', () => {
        expect(buildEmbedTag({type: 'image', id: 12})).toBe('<!--vps:embed:image:12-->');
    });

    it('builds hero tag', () => {
        expect(buildEmbedTag({type: 'hero', id: 3})).toBe('<!--vps:embed:hero:3-->');
    });

    it('builds collapse tag with URL-encoded JSON items', () => {
        const items = [{title: 'Title 1', body: 'Body 1'}];
        expect(buildEmbedTag({type: 'collapse', items})).toBe(collapseTag(items));
    });

    it('builds carousel tag with URL-encoded JSON items and extra params', () => {
        const items = [{title: 'Title 1', body: 'Body 1'}];
        expect(buildEmbedTag({type: 'carousel', items, extra: 'true:false:600'})).toBe(
            carouselTag(items, 'true:false:600'),
        );
    });
});

describe('buildCarouselTag', () => {
    it('builds a full carousel tag with URL-encoded JSON items', () => {
        const items = [{title: 'Title 1', body: 'Body 1'}];
        const tag = buildCarouselTag(items, {autoplay: true, dotDuration: false, speed: 300});
        expect(tag).toBe(carouselTag(items, 'true:false:300'));
    });
});

describe('parseEmbeds', () => {
    it('returns single html segment when no embeds', () => {
        const segments = parseEmbeds('<p>Hello</p>');
        expect(segments).toHaveLength(1);
        expect(segments[0]).toEqual({kind: 'html', content: '<p>Hello</p>'});
    });

    it('parses a single gallery embed', () => {
        const segments = parseEmbeds('<!--vps:embed:gallery:5-->');
        expect(segments).toHaveLength(1);
        expect(segments[0].kind).toBe('embed');
        if (segments[0].kind === 'embed') {
            expect(segments[0].descriptor.type).toBe('gallery');
            expect(segments[0].descriptor).toMatchObject({type: 'gallery', id: 5});
        }
    });

    it('splits html around an embed tag', () => {
        const html = '<p>Before</p><!--vps:embed:image:3--><p>After</p>';
        const segments = parseEmbeds(html);
        expect(segments).toHaveLength(3);
        expect(segments[0]).toEqual({kind: 'html', content: '<p>Before</p>'});
        if (segments[1].kind === 'embed') {
            expect(segments[1].descriptor).toMatchObject({type: 'image', id: 3});
        }
        expect(segments[2]).toEqual({kind: 'html', content: '<p>After</p>'});
    });

    it('parses carousel embed with extra params (legacy numeric format)', () => {
        const html = '<!--vps:embed:carousel:7:true:false:600-->';
        const segments = parseEmbeds(html);
        expect(segments).toHaveLength(1);
        expect(segments[0].kind).toBe('embed');
        if (segments[0].kind === 'embed') {
            expect(segments[0].descriptor.type).toBe('carousel');
            // Legacy numeric format: items is empty, extra contains the params
            expect(segments[0].descriptor).toMatchObject({type: 'carousel', items: []});
        }
    });

    it('parses collapse embed with URL-encoded JSON items', () => {
        const tag = collapseTag(SAMPLE_ITEMS);
        const segments = parseEmbeds(tag);
        expect(segments).toHaveLength(1);
        expect(segments[0].kind).toBe('embed');
        if (segments[0].kind === 'embed') {
            expect(segments[0].descriptor.type).toBe('collapse');
            expect(segments[0].descriptor).toMatchObject({type: 'collapse', items: SAMPLE_ITEMS});
        }
    });

    it('parses carousel embed with URL-encoded JSON items and extra params', () => {
        const tag = carouselTag(SAMPLE_ITEMS, 'true:false:600');
        const segments = parseEmbeds(tag);
        expect(segments).toHaveLength(1);
        expect(segments[0].kind).toBe('embed');
        if (segments[0].kind === 'embed') {
            expect(segments[0].descriptor.type).toBe('carousel');
            expect(segments[0].descriptor).toMatchObject({
                type: 'carousel',
                items: SAMPLE_ITEMS,
                extra: 'true:false:600',
            });
        }
    });

    it('parses multiple embeds', () => {
        const html = `${collapseTag(SAMPLE_ITEMS)}<!--vps:embed:hero:1-->`;
        const segments = parseEmbeds(html);
        expect(segments).toHaveLength(2);
        expect(segments[0].kind).toBe('embed');
        expect(segments[1].kind).toBe('embed');
        if (segments[0].kind === 'embed') {
            expect(segments[0].descriptor).toMatchObject({type: 'collapse', items: SAMPLE_ITEMS});
        }
        if (segments[1].kind === 'embed') expect(segments[1].descriptor.type).toBe('hero');
    });
});

describe('convertTagsToPlaceholders', () => {
    it('converts gallery tag to placeholder span', () => {
        const result = convertTagsToPlaceholders('<!--vps:embed:gallery:5-->');
        expect(result).toContain('class="vps-embed-placeholder"');
        expect(result).toContain('data-type="gallery"');
        expect(result).toContain('data-id="5"');
    });

    it('converts collapse tag with URL-encoded JSON items to placeholder span', () => {
        const tag = collapseTag(SAMPLE_ITEMS);
        const result = convertTagsToPlaceholders(tag);
        expect(result).toContain('class="vps-embed-placeholder"');
        expect(result).toContain('data-type="collapse"');
        expect(result).toContain('data-content=');
        expect(result).not.toContain('data-id=');
    });

    it('converts carousel tag with URL-encoded JSON items preserving extra params', () => {
        const tag = carouselTag(SAMPLE_ITEMS, 'true:false:600');
        const result = convertTagsToPlaceholders(tag);
        expect(result).toContain('data-type="carousel"');
        expect(result).toContain('data-content=');
        expect(result).not.toContain('data-id=');
    });

    it('leaves non-embed html unchanged', () => {
        const html = '<p>Just text</p>';
        expect(convertTagsToPlaceholders(html)).toBe(html);
    });
});

describe('convertPlaceholdersToTags', () => {
    it('is the inverse of convertTagsToPlaceholders for gallery', () => {
        const original = '<!--vps:embed:gallery:5-->';
        const placeholder = convertTagsToPlaceholders(original);
        const result = convertPlaceholdersToTags(placeholder);
        expect(result).toBe(original);
    });

    it('is the inverse of convertTagsToPlaceholders for collapse with URL-encoded JSON items', () => {
        const original = collapseTag(SAMPLE_ITEMS);
        const placeholder = convertTagsToPlaceholders(original);
        const result = convertPlaceholdersToTags(placeholder);
        expect(result).toBe(original);
    });

    it('is the inverse of convertTagsToPlaceholders for carousel with URL-encoded JSON items', () => {
        const original = carouselTag(SAMPLE_ITEMS, 'true:false:600');
        const placeholder = convertTagsToPlaceholders(original);
        const result = convertPlaceholdersToTags(placeholder);
        expect(result).toBe(original);
    });

    it('preserves surrounding html', () => {
        const html = '<p>Before</p><!--vps:embed:image:3--><p>After</p>';
        const withPlaceholders = convertTagsToPlaceholders(html);
        const restored = convertPlaceholdersToTags(withPlaceholders);
        expect(restored).toBe(html);
    });
});
