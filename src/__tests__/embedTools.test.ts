import {
    buildCarouselTag,
    buildEmbedTag,
    convertPlaceholdersToTags,
    convertTagsToPlaceholders,
    parseCarouselParams,
    parseEmbeds,
} from '../tools/embedTools';

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

    it('builds collapse tag', () => {
        expect(buildEmbedTag({type: 'collapse', id: 30})).toBe('<!--vps:embed:collapse:30-->');
    });

    it('builds carousel tag with extra params', () => {
        expect(buildEmbedTag({type: 'carousel', id: 7, extra: 'true:false:600'})).toBe(
            '<!--vps:embed:carousel:7:true:false:600-->',
        );
    });
});

describe('buildCarouselTag', () => {
    it('builds a full carousel tag', () => {
        const tag = buildCarouselTag(10, {autoplay: true, dotDuration: false, speed: 300});
        expect(tag).toBe('<!--vps:embed:carousel:10:true:false:300-->');
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
        expect(segments[0]).toEqual({kind: 'embed', descriptor: {type: 'gallery', id: 5, extra: undefined}});
    });

    it('splits html around an embed tag', () => {
        const html = '<p>Before</p><!--vps:embed:image:3--><p>After</p>';
        const segments = parseEmbeds(html);
        expect(segments).toHaveLength(3);
        expect(segments[0]).toEqual({kind: 'html', content: '<p>Before</p>'});
        expect(segments[1]).toEqual({kind: 'embed', descriptor: {type: 'image', id: 3, extra: undefined}});
        expect(segments[2]).toEqual({kind: 'html', content: '<p>After</p>'});
    });

    it('parses carousel embed with extra params', () => {
        const html = '<!--vps:embed:carousel:7:true:false:600-->';
        const segments = parseEmbeds(html);
        expect(segments).toHaveLength(1);
        expect(segments[0].kind).toBe('embed');
        if (segments[0].kind === 'embed') {
            expect(segments[0].descriptor.type).toBe('carousel');
            expect(segments[0].descriptor.id).toBe(7);
            expect(segments[0].descriptor.extra).toBe('true:false:600');
        }
    });

    it('parses multiple embeds', () => {
        const html = '<!--vps:embed:collapse:30--><!--vps:embed:hero:1-->';
        const segments = parseEmbeds(html);
        expect(segments).toHaveLength(2);
        expect(segments[0].kind).toBe('embed');
        expect(segments[1].kind).toBe('embed');
        if (segments[0].kind === 'embed') expect(segments[0].descriptor.type).toBe('collapse');
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

    it('converts carousel tag preserving extra params', () => {
        const result = convertTagsToPlaceholders('<!--vps:embed:carousel:7:true:false:600-->');
        expect(result).toContain('data-type="carousel"');
        expect(result).toContain('data-id="7"');
        expect(result).toContain('data-extra="true:false:600"');
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

    it('is the inverse of convertTagsToPlaceholders for carousel', () => {
        const original = '<!--vps:embed:carousel:7:true:false:600-->';
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
