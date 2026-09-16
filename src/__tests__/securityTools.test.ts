import {normalizeYoutubeEmbedUrl, sanitizeFooterMarkup, sanitizeHtmlFragment, sanitizeRichText} from "../tools";
import {convertTagsToPlaceholders, parseCarouselParams, parseEmbeds} from "../tools/embedTools";

describe("URL and HTML security helpers", () => {
    it("only accepts canonical HTTPS YouTube URLs", () => {
        expect(normalizeYoutubeEmbedUrl("https://www.youtube.com/watch?v=abc_123")).toBe(
            "https://www.youtube.com/embed/abc_123",
        );
        expect(normalizeYoutubeEmbedUrl("https://youtu.be/abc-123")).toBe(
            "https://www.youtube.com/embed/abc-123",
        );
        expect(normalizeYoutubeEmbedUrl("https://attacker.youtube.com/watch?v=abc123")).toBeNull();
        expect(normalizeYoutubeEmbedUrl("javascript:alert(1)")).toBeNull();
        expect(normalizeYoutubeEmbedUrl("https://www.youtube.com/watch?v=%3Cimg%20src=x%20onerror=alert(1)%3E")).toBeNull();
    });

    it("sanitizes footer markup to links and line breaks", () => {
        const result = sanitizeFooterMarkup(
            'Trusted <a href="https://example.test">link</a><img src=x onerror="alert(1)">'
            + '<a href="javascript:alert(1)">unsafe</a>',
        );

        expect(result).toContain('<a href="https://example.test">link</a>');
        expect(result).not.toContain("<img");
        expect(result).not.toContain("javascript:");
    });

    it("sanitizes rich text and canonicalizes safe embeds", () => {
        const result = sanitizeRichText(
            '<p>safe</p><script>alert(1)</script>'
            + '<!--vps:embed:youtube:https://attacker.example/video-->'
            + '<!--vps:embed:youtube:https://www.youtube.com/watch?v=abc123-->',
        );

        expect(result).toContain("<p>safe</p>");
        expect(result).not.toContain("<script");
        expect(result).not.toContain("attacker.example");
        expect(result).toContain("<!--vps:embed:youtube:https://www.youtube.com/embed/abc123-->");
    });

    it("uses a strict HTML fragment policy for preview content", () => {
        const result = sanitizeHtmlFragment("<form><input value=x></form><svg onload=alert(1)></svg><p>safe</p>");

        expect(result).toBe("<p>safe</p>");
    });

    it("rejects malformed embed item shapes instead of passing them to renderers", () => {
        const segments = parseEmbeds(
            '<!--vps:embed:collapse:[{"title":"ok","body":"<p>safe</p>"},{"title":{},"body":{}}]-->',
        );

        expect(segments).toHaveLength(1);
        expect(segments[0]).toEqual({
            kind: "embed",
            descriptor: {
                type: "collapse",
                items: [{title: "ok", body: "<p>safe</p>"}],
            },
        });
    });

    it("escapes embed placeholder labels before they become HTML", () => {
        const result = convertTagsToPlaceholders(
            "<!--vps:embed:youtube:<img src=x onerror=alert(1)>-->",
        );

        expect(result).not.toContain("<img");
        expect(result).toContain("&lt;img");
    });

    it("bounds carousel animation speeds", () => {
        expect(parseCarouselParams("true:false:999999").speed).toBe(60000);
        expect(parseCarouselParams("true:false:not-a-number").speed).toBe(500);
    });
});
