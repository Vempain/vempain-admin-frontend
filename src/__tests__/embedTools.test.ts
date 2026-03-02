import {buildCarouselTag, buildEmbedTag, convertPlaceholdersToTags, convertTagsToPlaceholders, parseCarouselParams, parseEmbeds,} from '../tools';

const SAMPLE_ITEMS = [
    {title: 'Title of the first item', body: 'Body of the first item'},
    {title: 'Title of the second item', body: 'Body of the second item'},
];

/** Build a plain-JSON collapse tag as it would appear in stored HTML */
function collapseTag(items: object[]): string {
    return `<!--vps:embed:collapse:${JSON.stringify(items)}-->`;
}

/** Build a plain-JSON carousel tag as it would appear in stored HTML */
function carouselTag(items: object[], extra: string): string {
    return `<!--vps:embed:carousel:${JSON.stringify(items)}:${extra}-->`;
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

    it('builds collapse tag with plain JSON items', () => {
        const items = [{title: 'Title 1', body: 'Body 1'}];
        expect(buildEmbedTag({type: 'collapse', items})).toBe(collapseTag(items));
    });

    it('builds carousel tag with plain JSON items and extra params', () => {
        const items = [{title: 'Title 1', body: 'Body 1'}];
        expect(buildEmbedTag({type: 'carousel', items, extra: 'true:false:600'})).toBe(
            carouselTag(items, 'true:false:600'),
        );
    });
});

describe('buildCarouselTag', () => {
    it('builds a full carousel tag with plain JSON items', () => {
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

    it('parses collapse embed with plain JSON items', () => {
        const tag = collapseTag(SAMPLE_ITEMS);
        const segments = parseEmbeds(tag);
        expect(segments).toHaveLength(1);
        expect(segments[0].kind).toBe('embed');
        if (segments[0].kind === 'embed') {
            expect(segments[0].descriptor.type).toBe('collapse');
            expect(segments[0].descriptor).toMatchObject({type: 'collapse', items: SAMPLE_ITEMS});
        }
    });

    it('parses carousel embed with plain JSON items and extra params', () => {
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

    it('parses collapse embed with HTML-rich body content', () => {
        const items = [
            {title: '01.11 Helsinki-Nairobi', body: '<p>Lento lähtee klo 6.15, joten aamuherätys on melko aikainen.</p><p>Pääsemme lentokentälle ajoissa.</p>'},
            {title: '02.11 Nairobi-Nakuru', body: '<p>Aamiaisen jälkeen pakkaudumme <b>safariautoihin</b>.</p>'},
        ];
        const tag = collapseTag(items);
        const segments = parseEmbeds(tag);
        expect(segments).toHaveLength(1);
        expect(segments[0].kind).toBe('embed');
        if (segments[0].kind === 'embed') {
            expect(segments[0].descriptor.type).toBe('collapse');
            expect(segments[0].descriptor).toMatchObject({type: 'collapse', items});
        }
    });

    it('parses collapse embed with newlines inside JSON body', () => {
        const items = [
            {title: 'Day 1', body: '<p>Line 1</p>\n<p>Line 2</p>'},
            {title: 'Day 2', body: '<p>More\ncontent</p>'},
        ];
        const tag = `<!--vps:embed:collapse:${JSON.stringify(items)}-->`;
        const segments = parseEmbeds(tag);
        expect(segments).toHaveLength(1);
        expect(segments[0].kind).toBe('embed');
        if (segments[0].kind === 'embed') {
            expect(segments[0].descriptor.type).toBe('collapse');
            expect(segments[0].descriptor).toMatchObject({type: 'collapse', items});
        }
    });

    it('parses collapse embed with newlines between JSON array items', () => {
        const tag = `<!--vps:embed:collapse:[{"title":"Day 1","body":"<p>Text</p>"},\n{"title":"Day 2","body":"<p>More</p>"}]-->`;
        const segments = parseEmbeds(tag);
        expect(segments).toHaveLength(1);
        expect(segments[0].kind).toBe('embed');
        if (segments[0].kind === 'embed') {
            expect(segments[0].descriptor.type).toBe('collapse');
            const desc = segments[0].descriptor as { type: 'collapse'; items: { title: string; body: string }[] };
            expect(desc.items).toHaveLength(2);
            expect(desc.items[0].title).toBe('Day 1');
            expect(desc.items[1].title).toBe('Day 2');
        }
    });

    it('parses real-world page content with hero, collapse with HTML bodies, and gallery', () => {
        const html =
            '<!--vps:embed:hero:71297-->' +
            '<p>Some introductory text.</p>' +
            '<!--vps:embed:collapse:[{"title":"01.11 Helsinki-Amsterdam-Nairobi","body":"<p>Lento lähtee klo 6.15, joten aamuherätys on melko aikainen. Taksia joudutaan odottelemaan hyvä tovi.</p><p>Aamuruuhkan ollessa vielä kaukana, ei matka lentokentälle kestä kauaa.</p>"},{"title":"02.11 Nairobi-Nakuru","body":"<p>Aamiaisen jälkeen pakkaudumme <b>safariautoihin</b> samoissa porukoissa.</p>"}]-->' +
            '<p>Some text after the collapsible.</p>' +
            '<!--vps:embed:gallery:1059-->';
        const segments = parseEmbeds(html);
        expect(segments).toHaveLength(5);

        // hero
        expect(segments[0].kind).toBe('embed');
        if (segments[0].kind === 'embed') {
            expect(segments[0].descriptor).toMatchObject({type: 'hero', id: 71297});
        }
        // text between hero and collapse
        expect(segments[1]).toEqual({kind: 'html', content: '<p>Some introductory text.</p>'});
        // collapse with 2 items
        expect(segments[2].kind).toBe('embed');
        if (segments[2].kind === 'embed') {
            expect(segments[2].descriptor.type).toBe('collapse');
            const desc = segments[2].descriptor as { type: 'collapse'; items: { title: string; body: string }[] };
            expect(desc.items).toHaveLength(2);
            expect(desc.items[0].title).toBe('01.11 Helsinki-Amsterdam-Nairobi');
            expect(desc.items[1].title).toBe('02.11 Nairobi-Nakuru');
        }
        // text between collapse and gallery
        expect(segments[3]).toEqual({kind: 'html', content: '<p>Some text after the collapsible.</p>'});
        // gallery
        expect(segments[4].kind).toBe('embed');
        if (segments[4].kind === 'embed') {
            expect(segments[4].descriptor).toMatchObject({type: 'gallery', id: 1059});
        }
    });

    it('parses collapse embed with many items containing long HTML bodies', () => {
        const items = Array.from({length: 12}, (_, i) => ({
            title: `Day ${i + 1} - Title`,
            body: `<p>${'A'.repeat(500)} with special chars like %2B17 and <b>bold text</b> and umlauts äöü.</p>`,
        }));
        const tag = collapseTag(items);
        const segments = parseEmbeds(tag);
        expect(segments).toHaveLength(1);
        expect(segments[0].kind).toBe('embed');
        if (segments[0].kind === 'embed') {
            expect(segments[0].descriptor.type).toBe('collapse');
            const desc = segments[0].descriptor as { type: 'collapse'; items: { title: string; body: string }[] };
            expect(desc.items).toHaveLength(12);
        }
    });
});

describe('convertTagsToPlaceholders', () => {
    it('converts gallery tag to placeholder span', () => {
        const result = convertTagsToPlaceholders('<!--vps:embed:gallery:5-->');
        expect(result).toContain('class="vps-embed-placeholder"');
        expect(result).toContain('data-type="gallery"');
        expect(result).toContain('data-id="5"');
    });

    it('converts collapse tag with plain JSON items to placeholder span', () => {
        const tag = collapseTag(SAMPLE_ITEMS);
        const result = convertTagsToPlaceholders(tag);
        expect(result).toContain('class="vps-embed-placeholder"');
        expect(result).toContain('data-type="collapse"');
        expect(result).toContain('data-content=');
        expect(result).not.toContain('data-id=');
    });

    it('converts carousel tag with plain JSON items preserving extra params', () => {
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

    it('converts collapse tag with HTML-rich body to placeholder with item count', () => {
        const items = [
            {title: 'Day 1', body: '<p>Some <b>bold</b> text</p>'},
            {title: 'Day 2', body: '<p>More text</p>'},
            {title: 'Day 3', body: '<p>Even more</p>'},
        ];
        const tag = collapseTag(items);
        const result = convertTagsToPlaceholders(tag);
        expect(result).toContain('📂 collapse (3 items)');
    });

    it('converts collapse with newlines in JSON body to correct placeholder', () => {
        const tag = `<!--vps:embed:collapse:[{"title":"A","body":"<p>Line1</p>\\n<p>Line2</p>"}]-->`;
        const result = convertTagsToPlaceholders(tag);
        expect(result).toContain('📂 collapse (1 item)');
        expect(result).toContain('data-type="collapse"');
    });
});

describe('convertPlaceholdersToTags', () => {
    it('is the inverse of convertTagsToPlaceholders for gallery', () => {
        const original = '<!--vps:embed:gallery:5-->';
        const placeholder = convertTagsToPlaceholders(original);
        const result = convertPlaceholdersToTags(placeholder);
        expect(result).toBe(original);
    });

    it('is the inverse of convertTagsToPlaceholders for collapse with plain JSON items', () => {
        const original = collapseTag(SAMPLE_ITEMS);
        const placeholder = convertTagsToPlaceholders(original);
        const result = convertPlaceholdersToTags(placeholder);
        expect(result).toBe(original);
    });

    it('is the inverse of convertTagsToPlaceholders for carousel with plain JSON items', () => {
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

    it('round-trips collapse with HTML-rich body content', () => {
        const items = [
            {title: 'Day 1', body: '<p>Text with <b>bold</b> and special chars like %2B and umlauts äöü.</p>'},
        ];
        const original = collapseTag(items);
        const placeholder = convertTagsToPlaceholders(original);
        const result = convertPlaceholdersToTags(placeholder);
        expect(result).toBe(original);
    });
});
