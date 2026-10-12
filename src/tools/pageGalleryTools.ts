import type {EmbedDescriptor} from "@vempain/vempain-rt-editor";

/**
 * The galleries a page depends on, derived from the embeds the rich-text editor reports: every gallery embed and every hero embed shown as
 * a carousel (its id is a gallery id). Ids keep the order of their first appearance in the body and appear once; the backend stores them
 * as the page's gallery links and publishes those galleries together with the page.
 */
export function galleryIdsFromEmbeds(embeds: EmbedDescriptor[]): number[] {
    const ids: number[] = [];

    for (const embed of embeds) {
        const galleryId = embed.type === "gallery" ? embed.id : embed.type === "hero" && embed.heroType === "carousel" ? embed.id : null;

        if (galleryId !== null && Number.isInteger(galleryId) && galleryId > 0 && !ids.includes(galleryId)) {
            ids.push(galleryId);
        }
    }

    return ids;
}

/** True when both lists hold the same ids in the same order, so that unchanged embeds do not trigger a state update */
export function sameGalleryIds(first: number[], second: number[]): boolean {
    return first.length === second.length && first.every((id, index) => id === second[index]);
}
