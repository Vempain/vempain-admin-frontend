import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import dayjs from "dayjs";
import {MemoryRouter} from "react-router-dom";
import {PageList} from "../../content/PageList";
import {pagedResponse, pageResponse} from "../helpers/testData";

const pageAPI = {findPageable: jest.fn(), publishAll: jest.fn()};
const trackTask = jest.fn();

jest.mock("@vempain/vempain-common-frontend", () => ({
    useTaskProgress: () => ({trackTask: (...args: unknown[]) => trackTask(...args)})
}));

jest.mock("../../services", () => ({
    userAPI: {findById: jest.fn(async () => ({id: 1, name: "Admin", nick: "admin"}))},
    pageAPI: {findPageable: (...a: unknown[]) => pageAPI.findPageable(...a), publishAll: (...a: unknown[]) => pageAPI.publishAll(...a)}
}));

const task = {task_id: "t4", type: "PUBLISH_ALL_PAGES", title: "p", status: "QUEUED", total_steps: 2};

function row(title: string): HTMLElement {
    return screen.getByText(title).closest("tr") as HTMLElement;
}

describe("PageList", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => undefined);
        jest.spyOn(window, "confirm").mockReturnValue(true);
        pageAPI.findPageable.mockResolvedValue(pagedResponse([
            pageResponse({published: dayjs("2026-01-05T08:00:00Z"), tags: ["travel", "finland"]}),
            pageResponse({id: 10, title: "Second page", page_path: "/news/second", modifier: null, modified: null})
        ]));
        pageAPI.publishAll.mockResolvedValue({result: "OK", message: "", timestamp: "", task});
    });

    afterEach(() => jest.restoreAllMocks());

    function renderList() {
        return render(<MemoryRouter><PageList/></MemoryRouter>);
    }

    it("lists the pages with their timestamps and the edit, delete and publish actions", async () => {
        renderList();
        expect(await screen.findByText("First page")).toBeInTheDocument();
        expect(screen.getByText("travel")).toHaveClass("ant-tag");
        expect(screen.getByText("finland")).toHaveClass("ant-tag");
        expect(pageAPI.findPageable).toHaveBeenCalledWith(expect.objectContaining({page: 0, size: 25, sort_by: "id", direction: "ASC"}));
        await waitFor(() => expect(within(row("First page")).getAllByText("Admin (admin)").length).toBe(2));
        expect(within(row("First page")).getByText(dayjs("2026-01-02T10:00:00Z").format("YYYY.MM.DD HH:mm"))).toBeInTheDocument();
        expect(within(row("First page")).getByText(dayjs("2026-01-05T08:00:00Z").format("YYYY.MM.DD HH:mm"))).toBeInTheDocument();
        expect(within(row("Second page")).getAllByText("-")).toHaveLength(2);
        expect(within(row("First page")).getAllByRole("link").map(link => link.getAttribute("href")))
                .toEqual(["/pages/9/edit", "/pages/9/delete", "/pages/9/publish"]);
        expect(screen.getByRole("link", {name: "plus-circle"})).toHaveAttribute("href", "/pages/0/edit");

        // The sticky header repeats the titles in a hidden measure row, so the sort clicks target the header cells
        fireEvent.click(screen.getByRole("columnheader", {name: /^Title\b/}));
        await waitFor(() => expect(pageAPI.findPageable).toHaveBeenLastCalledWith(expect.objectContaining({sort_by: "title"})));
        fireEvent.click(screen.getAllByRole("switch")[0]);
        await waitFor(() => expect(pageAPI.findPageable).toHaveBeenCalledTimes(3));
    });

    it("asks the backend for only the pages modified after their last publish when the filter is on", async () => {
        renderList();
        await screen.findByText("First page");
        expect(pageAPI.findPageable).toHaveBeenLastCalledWith(expect.objectContaining({modified_after_publish: false}));

        fireEvent.click(screen.getByRole("switch", {name: "Only modified after publish"}));
        await waitFor(() => expect(pageAPI.findPageable).toHaveBeenLastCalledWith(expect.objectContaining({modified_after_publish: true})));

        fireEvent.click(screen.getByRole("switch", {name: "Only modified after publish"}));
        await waitFor(() => expect(pageAPI.findPageable).toHaveBeenLastCalledWith(expect.objectContaining({modified_after_publish: false})));
    });

    it("publishes all pages as a background task and reloads the list once it has finished", async () => {
        renderList();
        await screen.findByText("First page");
        fireEvent.click(screen.getByText("Publish all pages"));
        expect(window.confirm).toHaveBeenCalledWith("Are you sure you want to publish all 2 pages?");
        await waitFor(() => expect(pageAPI.publishAll).toHaveBeenCalledWith(undefined));
        await waitFor(() => expect(trackTask).toHaveBeenCalledWith(task, expect.objectContaining({onFinished: expect.any(Function)})));
        (trackTask.mock.calls[0][1] as { onFinished: () => void }).onFinished();
        await waitFor(() => expect(pageAPI.findPageable).toHaveBeenCalledTimes(2));
    });

    it("publishes all pages at the scheduled time and reloads right away without a task", async () => {
        pageAPI.publishAll.mockResolvedValue({result: "OK", message: "", timestamp: "", task: null});
        renderList();
        await screen.findByText("First page");
        fireEvent.click(screen.getAllByRole("switch")[1]);
        const picker = await screen.findByPlaceholderText("Select date");
        fireEvent.mouseDown(picker);
        fireEvent.change(picker, {target: {value: "2026-15-04 10:30"}});
        fireEvent.keyDown(picker, {key: "Enter", code: "Enter"});
        await waitFor(() => expect((picker as HTMLInputElement).value).toBe("2026-15-04 10:30"));

        fireEvent.click(screen.getByText("Publish all pages"));
        await waitFor(() => expect(pageAPI.publishAll).toHaveBeenCalledWith({publish_date: expect.stringMatching(/^2026-04-15T10:30:00/)}));
        await waitFor(() => expect(pageAPI.findPageable).toHaveBeenCalledTimes(2));
        expect(trackTask).not.toHaveBeenCalled();
    });

    it("does nothing when the confirmation is declined and logs a failed publish", async () => {
        (window.confirm as jest.Mock).mockReturnValueOnce(false);
        renderList();
        await screen.findByText("First page");
        fireEvent.click(screen.getByText("Publish all pages"));
        expect(pageAPI.publishAll).not.toHaveBeenCalled();

        pageAPI.publishAll.mockRejectedValueOnce(new Error("rejected"));
        fireEvent.click(screen.getByText("Publish all pages"));
        await waitFor(() => expect(console.error).toHaveBeenCalledWith("Error publishing all pages"));
    });
});
