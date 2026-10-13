import {buildCarouselTag, buildEmbedTag, convertPlaceholdersToTags, convertTagsToPlaceholders, parseEmbeds} from "../../tools/embedTools";

describe("embedTools edge cases", () => {
    it("treats an embed opening without a type separator or with unbalanced JSON as plain html", () => {
        expect(parseEmbeds("<p>a</p><!--vps:embed:collapse")).toEqual([{kind: "html", content: "<p>a</p><!--vps:embed:collapse"}]);
        const unbalanced = "<!--vps:embed:collapse:[{\"title\":\"a\",\"body\":\"b\"}-->";
        expect(parseEmbeds(unbalanced)).toEqual([{kind: "html", content: unbalanced}]);
        const unclosed = "<!--vps:embed:carousel:[{\"title\":\"a\",\"body\":\"b\"}]";
        expect(parseEmbeds(unclosed)).toEqual([{kind: "html", content: unclosed}]);
    });

    it("builds numeric embeds with extra parameters", () => {
        expect(buildEmbedTag({type: "image", id: 3, extra: "w=100"})).toBe("<!--vps:embed:image:3:w=100-->");
    });

    it("labels placeholders for long youtube urls, music, gps and unparsable collapse content", () => {
        const longUrl = "https://youtu.be/" + "x".repeat(40);
        const youtube = convertTagsToPlaceholders(`<!--vps:embed:youtube:${longUrl}-->`);
        expect(youtube).toContain("▶ youtube:https://youtu.be/xxxxxxxxxxxxxxxxxxxxxxx...");
        expect(convertTagsToPlaceholders("<!--vps:embed:music:album-->")).toContain("🎼 music:album");
        expect(convertTagsToPlaceholders("<!--vps:embed:gps_timeseries:track-->")).toContain("🗺 gps:track");
        expect(convertTagsToPlaceholders("<!--vps:embed:last:images-->")).toContain("🧾 last 1 images");
        expect(convertTagsToPlaceholders("<!--vps:embed:collapse:[not json]-->")).toContain("📂 collapse:[not json]…");
        expect(convertTagsToPlaceholders("<!--vps:embed:carousel:[not json]-->")).toContain("🎠 carousel:[not json]…");
    });

    it("labels carousel placeholders with and without extra parameters", () => {
        const withExtra = buildCarouselTag([{title: "a", body: "b"}], {autoplay: true, dotDuration: false, speed: 700});
        expect(convertTagsToPlaceholders(withExtra)).toContain("🎠 carousel (1 item) speed:700ms");
        const withoutExtra = buildEmbedTag({type: "carousel", items: [{title: "a", body: "b"}, {title: "c", body: "d"}]});
        expect(convertTagsToPlaceholders(withoutExtra)).toContain("🎠 carousel (2 items)");
    });

    it("restores numeric placeholders with and without extra parameters", () => {
        const html = "<span class=\"vps-embed-placeholder\" data-type=\"image\" data-id=\"3\" data-extra=\"w=1\" contenteditable=\"false\">x</span>"
            + "<span class=\"vps-embed-placeholder\" data-type=\"hero\" data-id=\"4\" data-extra=\"\" contenteditable=\"false\">y</span>";
        expect(convertPlaceholdersToTags(html)).toBe("<!--vps:embed:image:3:w=1--><!--vps:embed:hero:4-->");
    });
});

describe("embedTools nested and spaced embeds", () => {
    it("accepts whitespace before the JSON payload", () => {
        const segments = parseEmbeds("<!--vps:embed:collapse:  [{\"title\":\"a\",\"body\":\"b\"}]-->");
        expect(segments).toEqual([{kind: "embed", descriptor: {type: "collapse", items: [{title: "a", body: "b"}]}}]);
    });

    it("keeps an embed tag quoted inside a collapse payload as part of that payload", () => {
        const html = "<!--vps:embed:collapse:[{\"title\":\"a\",\"body\":\"<!--vps:embed:image:1-->\"}]--><p>after</p>";
        const segments = parseEmbeds(html);
        expect(segments).toHaveLength(2);
        expect(segments[0]).toMatchObject({kind: "embed", descriptor: {type: "collapse"}});
        expect(segments[1]).toEqual({kind: "html", content: "<p>after</p>"});
        const placeholders = convertTagsToPlaceholders(html);
        expect(placeholders.match(/vps-embed-placeholder/g)).toHaveLength(1);
        expect(placeholders).toContain("📂 collapse (1 item)");
    });

    it("labels hero, video and audio placeholders", () => {
        expect(convertTagsToPlaceholders("<!--vps:embed:hero:4:type:carousel-->")).toContain("🎨 hero:4:type:carousel");
        expect(convertTagsToPlaceholders("<!--vps:embed:video:5-->")).toContain("🎬 video:5");
        expect(convertTagsToPlaceholders("<!--vps:embed:audio:6-->")).toContain("🎵 audio:6");
    });
});
