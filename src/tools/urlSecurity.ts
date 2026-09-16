const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "youtu.be", "www.youtu.be"]);
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

/**
 * Return a canonical YouTube embed URL, or null for anything outside the
 * explicitly supported HTTPS YouTube hosts and URL shapes.
 */
export function normalizeYoutubeEmbedUrl(url: string): string | null {
    try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase();

        if (parsed.protocol !== "https:" || !YOUTUBE_HOSTS.has(host)) {
            return null;
        }

        let videoId: string | null = null;
        if (host === "youtu.be" || host === "www.youtu.be") {
            const [pathId] = parsed.pathname.split("/").filter(Boolean);
            videoId = pathId ?? null;
        } else if (parsed.pathname === "/watch") {
            videoId = parsed.searchParams.get("v");
        } else if (parsed.pathname.startsWith("/embed/")) {
            const [pathId] = parsed.pathname.substring("/embed/".length).split("/");
            videoId = pathId ?? null;
        }

        if (!videoId || !VIDEO_ID_PATTERN.test(videoId)) {
            return null;
        }

        return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`;
    } catch {
        return null;
    }
}
