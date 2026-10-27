import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import dayjs from "dayjs";
import {PagePublish} from "../../content/PagePublish";
import {PublishSchedule} from "../../content/PublishSchedule";
import {PageView} from "../../content/PageView";
import {fileGroupListResponse, pageResponse} from "../helpers/testData";
import {renderAt} from "../helpers/renderUtils";

const pageAPI = {findById: jest.fn(), publish: jest.fn()};
const galleryAPI = {findListByPage: jest.fn(), findPageableList: jest.fn()};
const siteFileAPI = {getPagedSiteFiles: jest.fn()};
const dataAPI = {getAllDataSets: jest.fn()};
const trackTask = jest.fn();

jest.mock("@vempain/vempain-common-frontend", () => ({
    useTaskProgress: () => ({trackTask: (...args: unknown[]) => trackTask(...args)})
}));

jest.mock("../../services", () => ({
    pageAPI: {findById: (...a: unknown[]) => pageAPI.findById(...a), publish: (...a: unknown[]) => pageAPI.publish(...a)},
    galleryAPI: {
        findListByPage: (...a: unknown[]) => galleryAPI.findListByPage(...a),
        findPageableList: (...a: unknown[]) => galleryAPI.findPageableList(...a)
    },
    siteFileAPI: {getPagedSiteFiles: (...a: unknown[]) => siteFileAPI.getPagedSiteFiles(...a)},
    dataAPI: {getAllDataSets: (...a: unknown[]) => dataAPI.getAllDataSets(...a)}
}));

const {rtEditorTestHooks} = jest.requireActual("@vempain/vempain-rt-editor") as {
    rtEditorTestHooks: { dataProviders?: Record<string, (params?: unknown) => Promise<unknown>> }
};

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    pageAPI.findById.mockResolvedValue(pageResponse({body: "<p>Hello</p><script>x()</script>", page_style: ".vps-page-canvas { color: red; }"}));
    pageAPI.publish.mockResolvedValue({result: "OK", message: "", timestamp: "", task: null});
    galleryAPI.findListByPage.mockResolvedValue([fileGroupListResponse()]);
    galleryAPI.findPageableList.mockResolvedValue({content: []});
    siteFileAPI.getPagedSiteFiles.mockResolvedValue({content: []});
    dataAPI.getAllDataSets.mockResolvedValue([]);
});

afterEach(() => jest.restoreAllMocks());

describe("PublishSchedule", () => {
    it("reports the schedule switch and the picked date to the host", async () => {
        const setSchedulePublish = jest.fn();
        const setPublishDate = jest.fn();
        render(<PublishSchedule setSchedulePublish={setSchedulePublish} setPublishDate={setPublishDate}/>);

        expect(screen.queryByPlaceholderText("Select date")).toBeNull();
        fireEvent.click(screen.getByRole("switch"));
        expect(setSchedulePublish).toHaveBeenCalledWith(true);
        const picker = await screen.findByPlaceholderText("Select date");
        fireEvent.mouseDown(picker);
        fireEvent.change(picker, {target: {value: "2026-15-04 10:30"}});
        fireEvent.keyDown(picker, {key: "Enter", code: "Enter"});
        await waitFor(() => expect(setPublishDate).toHaveBeenCalled());
        const picked = setPublishDate.mock.calls.at(-1)[0];
        expect(dayjs(picked).format("YYYY-MM-DD HH:mm")).toBe("2026-04-15 10:30");

        fireEvent.click(screen.getByRole("switch"));
        expect(setSchedulePublish).toHaveBeenLastCalledWith(false);
        await waitFor(() => expect(screen.queryByPlaceholderText("Select date")).toBeNull());
    });
});

describe("PagePublish", () => {
    const route = {route: "/pages/9/publish", path: "/pages/:paramId/publish"};

    it("shows the sanitized body and the linked galleries, then publishes right away as a background task", async () => {
        pageAPI.publish.mockResolvedValue({
            result: "OK",
            message: "",
            timestamp: "",
            task: {task_id: "t1", type: "PUBLISH_PAGE", title: "p", status: "QUEUED", total_steps: 1}
        });
        renderAt(<PagePublish/>, route);

        const editor = await screen.findByTestId("rich-text-editor");
        expect(editor).toHaveValue("<p>Hello</p>");
        expect(editor).toHaveAttribute("readonly");
        // the read-only preview shows the page with its own style
        expect(screen.getByTestId("rich-text-editor-page-style")).toHaveTextContent(".vps-page-canvas { color: red; }");
        expect(screen.getByText("Summer")).toBeInTheDocument();
        expect(screen.getByText("Summer pictures")).toBeInTheDocument();
        expect(screen.getByText("3")).toBeInTheDocument();
        expect(pageAPI.findById).toHaveBeenCalledWith(9, null);
        expect(galleryAPI.findListByPage).toHaveBeenCalledWith(9);

        fireEvent.change(document.querySelector("textarea.ant-input") as HTMLElement, {target: {value: "Release 1"}});
        fireEvent.click(screen.getByText("Publish page"));
        await waitFor(() => expect(pageAPI.publish).toHaveBeenCalledWith({
            id: 9,
            publish_message: "Release 1",
            publish_schedule: false,
            publish_date_time: null
        }));
        expect(trackTask).toHaveBeenCalledWith(expect.objectContaining({task_id: "t1"}));
        expect(await screen.findByText("Page publishing started, follow it in the task tray")).toBeInTheDocument();
        expect(screen.getByText("Back").closest("a")).toHaveAttribute("href", "/pages");
    });

    it("schedules the publishing for the selected time without a task", async () => {
        galleryAPI.findListByPage.mockResolvedValue([]);
        renderAt(<PagePublish/>, route);
        await screen.findByTestId("rich-text-editor");
        expect(document.querySelector("table")).toBeNull();

        fireEvent.click(screen.getByRole("switch"));
        const picker = await screen.findByPlaceholderText("Select date");
        fireEvent.mouseDown(picker);
        fireEvent.change(picker, {target: {value: "2026-15-04 10:30"}});
        fireEvent.keyDown(picker, {key: "Enter", code: "Enter"});
        fireEvent.click(screen.getByText("Publish page"));

        await waitFor(() => expect(pageAPI.publish).toHaveBeenCalledTimes(1));
        const request = pageAPI.publish.mock.calls[0][0];
        expect(request.publish_schedule).toBe(true);
        expect(dayjs(request.publish_date_time).format("YYYY-MM-DD HH:mm")).toBe("2026-04-15 10:30");
        expect(trackTask).not.toHaveBeenCalled();
        expect(await screen.findByText("Page publishing scheduled")).toBeInTheDocument();
    });

    it("uses the current time when scheduling without a picked date", async () => {
        renderAt(<PagePublish/>, route);
        await screen.findByTestId("rich-text-editor");
        fireEvent.click(screen.getByRole("switch"));
        fireEvent.click(screen.getByText("Publish page"));
        await waitFor(() => expect(pageAPI.publish).toHaveBeenCalledTimes(1));
        expect(dayjs(pageAPI.publish.mock.calls[0][0].publish_date_time).isValid()).toBe(true);
    });

    it("wires the read-only editor's data providers to the services", async () => {
        renderAt(<PagePublish/>, route);
        await screen.findByTestId("rich-text-editor");
        const providers = rtEditorTestHooks.dataProviders as Record<string, (params?: unknown) => Promise<unknown>>;
        await providers.findGalleries({page: 0, size: 5});
        expect(galleryAPI.findPageableList).toHaveBeenCalledWith({page: 0, size: 5});
        await providers.getPagedSiteFiles({page: 0, size: 5, file_type: "IMAGE"});
        expect(siteFileAPI.getPagedSiteFiles).toHaveBeenCalledWith({page: 0, size: 5, file_type: "IMAGE"});
        await providers.getAllDataSets();
        expect(dataAPI.getAllDataSets).toHaveBeenCalledWith(undefined);
    });

    it("reports a failed publish, a failed load and an invalid id", async () => {
        pageAPI.publish.mockRejectedValueOnce(new Error("rejected"));
        renderAt(<PagePublish/>, route);
        fireEvent.click(await screen.findByText("Publish page"));
        expect(await screen.findByText("Failed to publish the page, try again later")).toBeInTheDocument();

        galleryAPI.findListByPage.mockRejectedValueOnce(new Error("down"));
        renderAt(<PagePublish/>, route);
        expect(await screen.findByText("Failed to fetch the page details, try again later")).toBeInTheDocument();

        renderAt(<PagePublish/>, {route: "/pages/-1/publish", path: route.path});
        expect(screen.getByText("Called with invalid parameter")).toBeInTheDocument();
    });
});

describe("PageView", () => {
    const route = {route: "/pages/9/view", path: "/pages/:paramId/view"};

    it("renders the page body with every embed replaced by its preview component", async () => {
        const items = JSON.stringify([{title: "Section", body: "<b>bold</b><script>x()</script>"}]);
        pageAPI.findById.mockResolvedValue(pageResponse({
            title: "Embeds",
            body: "<p>Intro</p><img src=x onerror=alert(1)>"
                    + "<!--vps:embed:gallery:12-->"
                    + "<!--vps:embed:image:3-->"
                    + "<!--vps:embed:hero:4-->"
                    + `<!--vps:embed:collapse:${items}-->`
                    + `<!--vps:embed:carousel:${items}:true:true:800-->`
                    + `<!--vps:embed:carousel:${items}-->`
                    + "<!--vps:embed:video:5-->"
                    + "<!--vps:embed:audio:6-->"
                    + "<!--vps:embed:youtube:https://youtu.be/abc123-->"
                    + "<!--vps:embed:youtube:https://evil.example/x-->"
                    + "<!--vps:embed:last:pages:3-->"
                    + "<!--vps:embed:music:album-->"
        }));
        renderAt(<PageView/>, route);

        expect(await screen.findAllByRole("heading", {name: "Embeds"})).toHaveLength(2);
        expect(screen.getByText("Intro")).toBeInTheDocument();
        expect(document.querySelector("img[onerror]")).toBeNull();
        expect(screen.getByText("🖼 Gallery #12")).toBeInTheDocument();
        expect(screen.getByAltText("Embedded image 3")).toHaveAttribute("src", "http://localhost:8080/files/files/3");
        expect(screen.getByAltText("Hero image 4")).toBeInTheDocument();
        expect(screen.getAllByText("Section").length).toBeGreaterThanOrEqual(3);
        expect(document.querySelector("video source")).toHaveAttribute("src", "http://localhost:8080/files/files/5");
        expect(document.querySelector("audio source")).toHaveAttribute("src", "http://localhost:8080/files/files/6");
        expect(screen.getByTitle("YouTube Embed")).toHaveAttribute("src", "https://www.youtube.com/embed/abc123");
        expect(screen.getByRole("status")).toHaveTextContent("Unsupported video URL");
        expect(screen.getByText("🧾 last:pages:3")).toBeInTheDocument();
        expect(document.querySelectorAll("script")).toHaveLength(0);
    });

    it("rejects an invalid id, reports a failed load and renders nothing for an empty page", async () => {
        renderAt(<PageView/>, {route: "/pages/0/view", path: route.path});
        expect(screen.getByText("Invalid page ID")).toBeInTheDocument();
        expect(screen.getByText("Back").closest("a")).toHaveAttribute("href", "/pages");

        pageAPI.findById.mockRejectedValueOnce(new Error("down"));
        renderAt(<PageView/>, route);
        expect(await screen.findByText("Failed to load page")).toBeInTheDocument();

        pageAPI.findById.mockResolvedValueOnce(null);
        const {container} = renderAt(<PageView/>, route);
        await waitFor(() => expect(pageAPI.findById).toHaveBeenCalledTimes(2));
        await waitFor(() => expect(container.querySelector(".ant-spin")).toBeNull());
        expect(container.textContent).toBe("");
    });
});
