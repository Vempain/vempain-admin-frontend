import type {EmbedDescriptor} from "@vempain/vempain-rt-editor";
import {galleryIdsFromEmbeds, sameGalleryIds} from "../tools/pageGalleryTools";

describe("galleryIdsFromEmbeds", () => {
    it("collects gallery and hero carousel embeds once each, in body order", () => {
        const embeds: EmbedDescriptor[] = [
            {type: "image", id: 3},
            {type: "hero", id: 12, heroType: "carousel", heroDuration: 5, heroTransition: "slide"},
            {type: "gallery", id: 7},
            {type: "gallery", id: 7, extra: "x"},
            {type: "hero", id: 4, heroType: "image"},
            {type: "hero", id: 9, heroType: "video"},
            {type: "youtube", url: "https://youtu.be/abc"},
            {type: "last", itemType: "galleries", count: 5},
            {type: "gallery", id: 12},
            {type: "gallery", id: 21},
        ];

        expect(galleryIdsFromEmbeds(embeds)).toEqual([12, 7, 21]);
    });

    it("ignores ids that cannot be gallery ids", () => {
        expect(galleryIdsFromEmbeds([{type: "gallery", id: 0}, {type: "gallery", id: Number.NaN}, {type: "gallery", id: -3}])).toEqual([]);
        expect(galleryIdsFromEmbeds([])).toEqual([]);
    });
});

describe("sameGalleryIds", () => {
    it("compares the ids in order", () => {
        expect(sameGalleryIds([], [])).toBe(true);
        expect(sameGalleryIds([1, 2], [1, 2])).toBe(true);
        expect(sameGalleryIds([1, 2], [2, 1])).toBe(false);
        expect(sameGalleryIds([1], [1, 2])).toBe(false);
    });
});
