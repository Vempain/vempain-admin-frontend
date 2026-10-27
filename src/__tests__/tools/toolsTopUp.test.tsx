import {render, screen} from "@testing-library/react";
import {contentTypeEnumToTag, publishStatusEnumToTag} from "../../tools/enum2Tags";
import {isWebSiteAclResponse, isWebSiteResourceResponse, isWebSiteUserResponse} from "../../tools/WebSiteTools";
import {getPaginationConfig} from "../../tools/tablePaginationConfig";
import {stickyTableHeader, TOP_BAR_HEIGHT} from "../../tools/tableStickyConfig";
import {formatDate} from "../../tools/timeTools";
import {normalizeYoutubeEmbedUrl} from "../../tools/urlSecurity";
import {sanitizeHtmlFragment, sanitizeRichText} from "../../tools/richTextSecurity";
import {buildCarouselTag, buildEmbedTag} from "../../tools/embedTools";
import {ContentTypeEnum, PublishStatusEnum} from "../../models";

describe("enum2Tags", () => {
    it("renders a labelled tag for every content type and an Unknown fallback", () => {
        const {container} = render(<>
            {contentTypeEnumToTag(ContentTypeEnum.GALLERY, 1)}
            {contentTypeEnumToTag(ContentTypeEnum.COMPONENT, 1)}
            {contentTypeEnumToTag(ContentTypeEnum.LAYOUT, 1)}
            {contentTypeEnumToTag(ContentTypeEnum.FORM, 1)}
            {contentTypeEnumToTag(ContentTypeEnum.PAGE, 1)}
            {contentTypeEnumToTag("OTHER" as ContentTypeEnum, 1)}
        </>);
        expect(screen.getByText("Gallery")).toHaveClass("ant-tag-blue");
        expect(screen.getByText("Component")).toHaveClass("ant-tag-green");
        expect(screen.getByText("Layout")).toHaveClass("ant-tag-purple");
        expect(screen.getByText("Form")).toHaveClass("ant-tag-orange");
        expect(screen.getByText("Page")).toHaveClass("ant-tag-red");
        expect(screen.getByText("Unknown")).toHaveClass("ant-tag-volcano");
        expect(container.querySelectorAll(".ant-tag")).toHaveLength(6);
    });

    it("renders a labelled tag for every publish status and an Unknown fallback", () => {
        render(<>
            {publishStatusEnumToTag(PublishStatusEnum.NOT_PUBLISHED, 2)}
            {publishStatusEnumToTag(PublishStatusEnum.PUBLISHED, 2)}
            {publishStatusEnumToTag(PublishStatusEnum.PROCESSING, 2)}
            {publishStatusEnumToTag(PublishStatusEnum.CANCELLED, 2)}
            {publishStatusEnumToTag("WEIRD", 2)}
        </>);
        expect(screen.getByText("Not published")).toHaveClass("ant-tag-yellow");
        expect(screen.getByText("Published")).toHaveClass("ant-tag-green");
        expect(screen.getByText("Processing")).toHaveClass("ant-tag-blue");
        expect(screen.getByText("Cancelled")).toHaveClass("ant-tag-red");
        expect(screen.getByText("Unknown")).toHaveClass("ant-tag-volcano");
    });
});

describe("WebSiteTools type guards", () => {
    it("recognises web site user, ACL and resource responses", () => {
        expect(isWebSiteUserResponse({id: 1, username: "u", creator: 1, created: "2026"})).toBe(true);
        expect(isWebSiteUserResponse({id: 1, username: "u"})).toBe(false);
        expect(isWebSiteUserResponse(null)).toBe(false);
        expect(isWebSiteAclResponse({id: 1, acl_id: 2, user_id: 3, creator: 1, created: "2026"})).toBe(true);
        expect(isWebSiteAclResponse({id: 1, acl_id: 2})).toBe(false);
        expect(isWebSiteAclResponse("acl")).toBe(false);
        expect(isWebSiteResourceResponse({resource_type: "PAGE"})).toBe(true);
        expect(isWebSiteResourceResponse(null)).toBe(false);
        expect(isWebSiteResourceResponse(5)).toBe(false);
    });
});

describe("getPaginationConfig", () => {
    it("adds the total to the shared table pagination settings", () => {
        const config = getPaginationConfig(42);
        expect(config.total).toBe(42);
        expect(config.defaultPageSize).toBe(15);
        expect(config.showSizeChanger).toBe(true);
        expect(config.pageSizeOptions).toContain("100");
    });
});

describe("formatDate", () => {
    it("formats Dayjs objects and ISO strings as dates", () => {
        expect(formatDate("2026-03-04T10:11:12Z")).toMatch(/^2026-03-0[45]$/);
    });
});

describe("normalizeYoutubeEmbedUrl", () => {
    it("accepts the /embed/ path form and rejects unparsable URLs", () => {
        expect(normalizeYoutubeEmbedUrl("https://www.youtube.com/embed/abc123/extra")).toBe("https://www.youtube.com/embed/abc123");
        expect(normalizeYoutubeEmbedUrl("https://www.youtube.com/embed/")).toBeNull();
        expect(normalizeYoutubeEmbedUrl("not a url")).toBeNull();
        expect(normalizeYoutubeEmbedUrl("https://www.youtube.com/playlist?list=1")).toBeNull();
    });
});

describe("sanitizeRichText", () => {
    it("returns an empty string for non-string input", () => {
        expect(sanitizeRichText(undefined)).toBe("");
        expect(sanitizeRichText(42)).toBe("");
        expect(sanitizeHtmlFragment(null)).toBe("");
    });

    it("keeps canonical embeds and drops unsafe or invalid ones", () => {
        const body = [
            "<p>Intro</p><script>alert(1)</script>",
            buildEmbedTag({type: "youtube", url: "https://youtu.be/vid123"}),
            buildEmbedTag({type: "youtube", url: "http://evil.example/x"}),
            buildEmbedTag({type: "music", identifier: "album_2026"}),
            buildEmbedTag({type: "gps_timeseries", identifier: "bad identifier!"}),
            "<!--vps:embed:collapse:[{\"title\":\"T\",\"body\":\"<b>x</b><script>y</script>\"},{\"title\":1,\"body\":\"z\"}]-->",
            buildCarouselTag([{title: "C", body: "<i>c</i>"}], {autoplay: true, dotDuration: false, speed: 700}),
            buildEmbedTag({type: "carousel", items: [{title: "D", body: "d"}]}),
            buildEmbedTag({type: "last", itemType: "pages", count: 3}),
            buildEmbedTag({type: "gallery", id: 5}),
            buildEmbedTag({type: "image", id: 0}),
            buildEmbedTag({type: "hero", id: 2}),
            buildEmbedTag({type: "video", id: 3}),
            buildEmbedTag({type: "audio", id: -1})
        ].join("");

        const sanitized = sanitizeRichText(body);

        expect(sanitized).toContain("<p>Intro</p>");
        expect(sanitized).not.toContain("<script>");
        expect(sanitized).toContain("<!--vps:embed:youtube:https://www.youtube.com/embed/vid123-->");
        expect(sanitized).not.toContain("evil.example");
        expect(sanitized).toContain("<!--vps:embed:music:album_2026-->");
        expect(sanitized).not.toContain("gps_timeseries");
        expect(sanitized).toContain("<!--vps:embed:collapse:[{\"title\":\"T\",\"body\":\"<b>x</b>\"}]-->");
        expect(sanitized).toContain(":true:false:700-->");
        expect(sanitized).toContain("<!--vps:embed:carousel:[{\"title\":\"D\",\"body\":\"d\"}]:false:false:500-->");
        expect(sanitized).toContain("<!--vps:embed:last:pages:3-->");
        expect(sanitized).toContain("<!--vps:embed:gallery:5-->");
        expect(sanitized).toContain("<!--vps:embed:hero:2-->");
        expect(sanitized).toContain("<!--vps:embed:video:3-->");
        expect(sanitized).not.toContain("<!--vps:embed:image:");
        expect(sanitized).not.toContain("<!--vps:embed:audio:");
    });
});

describe("tableStickyConfig", () => {
    it("docks the sticky table header right below the fixed top bar", () => {
        expect(stickyTableHeader).toEqual({offsetHeader: TOP_BAR_HEIGHT});
        expect(TOP_BAR_HEIGHT).toBe(60);
    });
});
