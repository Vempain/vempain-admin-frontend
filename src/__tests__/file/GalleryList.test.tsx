import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {message} from "antd";
import {MemoryRouter} from "react-router-dom";
import {GalleryList} from "../../file/GalleryList";
import {acl, fileGroupListResponse, pagedResponse, SESSION_USER_ID} from "../helpers/testData";

const useSession = jest.fn();
const galleryAPI = {findPageableList: jest.fn(), publishAll: jest.fn(), publishSelectedGalleries: jest.fn()};
const fileSystemAPI = {refreshAllGalleryFiles: jest.fn()};
const trackTask = jest.fn();

jest.mock("@vempain/vempain-auth-frontend", () => ({
    ...jest.requireActual("@vempain/vempain-auth-frontend"),
    useSession: () => useSession()
}));

jest.mock("@vempain/vempain-common-frontend", () => ({
    TaskStatusEnum: {QUEUED: "QUEUED", RUNNING: "RUNNING", CANCELLING: "CANCELLING", CANCELLED: "CANCELLED", COMPLETED: "COMPLETED", FAILED: "FAILED"},
    useTaskProgress: () => ({trackTask: (...args: unknown[]) => trackTask(...args)})
}));

jest.mock("../../services", () => ({
    galleryAPI: {
        findPageableList: (...a: unknown[]) => galleryAPI.findPageableList(...a),
        publishAll: (...a: unknown[]) => galleryAPI.publishAll(...a),
        publishSelectedGalleries: (...a: unknown[]) => galleryAPI.publishSelectedGalleries(...a)
    },
    fileSystemAPI: {refreshAllGalleryFiles: (...a: unknown[]) => fileSystemAPI.refreshAllGalleryFiles(...a)}
}));

const task = {task_id: "t3", type: "PUBLISH_GALLERY", title: "g", status: "QUEUED", total_steps: 3};

function row(name: string): HTMLElement {
    return screen.getByText(name).closest("tr") as HTMLElement;
}

describe("GalleryList", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => undefined);
        jest.spyOn(message, "success").mockImplementation(() => ({}) as never);
        jest.spyOn(message, "error").mockImplementation(() => ({}) as never);
        jest.spyOn(message, "info").mockImplementation(() => ({}) as never);
        jest.spyOn(window, "confirm").mockReturnValue(true);
        useSession.mockReturnValue({userSession: {id: SESSION_USER_ID, units: [{id: 3}]}});
        galleryAPI.findPageableList.mockResolvedValue(pagedResponse([
            fileGroupListResponse(),
            fileGroupListResponse({
                id: 13,
                short_name: "Winter",
                description: "Snow",
                file_count: 0,
                acls: [acl({user: 99, create_privilege: false, modify_privilege: false, delete_privilege: false})],
                modified: fileGroupListResponse().created
            })
        ]));
        galleryAPI.publishAll.mockResolvedValue({result: "OK", message: "", timestamp: "", task});
        galleryAPI.publishSelectedGalleries.mockResolvedValue({result: "OK", message: "", timestamp: "", task});
        fileSystemAPI.refreshAllGalleryFiles.mockResolvedValue({result: "OK", refreshed_items: 1, failed_items: 0, details: [], task});
    });

    afterEach(() => jest.restoreAllMocks());

    function renderList() {
        return render(<MemoryRouter><GalleryList/></MemoryRouter>);
    }

    it("lists the galleries with the actions the user's privileges allow", async () => {
        renderList();
        expect(await screen.findByText("Summer")).toBeInTheDocument();
        expect(galleryAPI.findPageableList).toHaveBeenCalledWith(expect.objectContaining({page: 0, size: 25, sort_by: "id", direction: "ASC"}));
        expect(within(row("Summer")).getByText("Summer pictures")).toBeInTheDocument();
        expect(within(row("Summer")).getByText("3")).toBeInTheDocument();
        expect(within(row("Summer")).getByText("-")).toBeInTheDocument();
        expect(within(row("Summer")).getAllByRole("link").map(link => link.getAttribute("href")))
                .toEqual(["/galleries/12/edit", "/galleries/12/delete", "/galleries/12/publish", "/galleries/12/refresh"]);
        expect(within(row("Winter")).getAllByRole("link").map(link => link.getAttribute("href"))).toEqual(["/galleries/13/edit"]);
        expect(within(row("Winter")).queryByText("-")).toBeNull();
        expect(screen.getByRole("link", {name: "plus-circle"})).toHaveAttribute("href", "/galleries/0/edit");

        fireEvent.click(screen.getByText("Name"));
        await waitFor(() => expect(galleryAPI.findPageableList).toHaveBeenLastCalledWith(expect.objectContaining({sort_by: "short_name"})));
        fireEvent.click(screen.getByText("Description"));
        await waitFor(() => expect(galleryAPI.findPageableList).toHaveBeenLastCalledWith(expect.objectContaining({sort_by: "description"})));
    });

    it("publishes all galleries as a background task and reloads once it has finished", async () => {
        renderList();
        await screen.findByText("Summer");
        fireEvent.click(screen.getByText("Publish all galleries"));
        await waitFor(() => expect(galleryAPI.publishAll).toHaveBeenCalledWith(undefined));
        expect(window.confirm).toHaveBeenCalledWith("Are you sure you want to publish all 2 galleries?");
        await waitFor(() => expect(trackTask).toHaveBeenCalledWith(task, expect.objectContaining({onFinished: expect.any(Function)})));
        (trackTask.mock.calls[0][1] as { onFinished: () => void }).onFinished();
        await waitFor(() => expect(galleryAPI.findPageableList).toHaveBeenCalledTimes(2));
    });

    it("publishes all galleries at the scheduled time and reloads right away without a task", async () => {
        galleryAPI.publishAll.mockResolvedValue({result: "OK", message: "", timestamp: "", task: null});
        renderList();
        await screen.findByText("Summer");
        fireEvent.click(screen.getByRole("switch"));
        const picker = await screen.findByPlaceholderText("Select date");
        fireEvent.mouseDown(picker);
        fireEvent.change(picker, {target: {value: "2026-15-04 10:30"}});
        fireEvent.keyDown(picker, {key: "Enter", code: "Enter"});
        await waitFor(() => expect((picker as HTMLInputElement).value).toBe("2026-15-04 10:30"));

        fireEvent.click(screen.getByText("Publish all galleries"));
        await waitFor(() => expect(galleryAPI.publishAll).toHaveBeenCalledWith({publish_date: expect.stringMatching(/^2026-04-15T10:30:00/)}));
        await waitFor(() => expect(galleryAPI.findPageableList).toHaveBeenCalledTimes(2));
        expect(trackTask).not.toHaveBeenCalled();
    });

    it("does nothing when the publish-all or refresh-all confirmation is declined", async () => {
        (window.confirm as jest.Mock).mockReturnValue(false);
        renderList();
        await screen.findByText("Summer");
        fireEvent.click(screen.getByText("Publish all galleries"));
        fireEvent.click(screen.getByText("Refresh all gallery files"));
        expect(galleryAPI.publishAll).not.toHaveBeenCalled();
        expect(fileSystemAPI.refreshAllGalleryFiles).not.toHaveBeenCalled();
    });

    it("publishes the selected galleries", async () => {
        renderList();
        await screen.findByText("Summer");
        const publishSelected = screen.getByText(/Publish selected galleries/).closest("button") as HTMLButtonElement;
        expect(publishSelected).toBeDisabled();
        fireEvent.click(publishSelected);
        expect(galleryAPI.publishSelectedGalleries).not.toHaveBeenCalled();

        fireEvent.click(within(row("Summer")).getByRole("checkbox"));
        expect(await screen.findByText("Publish selected galleries (1)")).toBeInTheDocument();
        fireEvent.click(screen.getByText("Publish selected galleries (1)"));
        await waitFor(() => expect(galleryAPI.publishSelectedGalleries).toHaveBeenCalledWith({gallery_ids: [12]}));
        expect(trackTask).toHaveBeenCalledWith(task, expect.objectContaining({onFinished: expect.any(Function)}));
        expect(message.success).toHaveBeenCalledWith("Selected galleries publishing started");
        expect(await screen.findByText("Publish selected galleries (0)")).toBeInTheDocument();
        (trackTask.mock.calls[0][1] as { onFinished: () => void }).onFinished();
        await waitFor(() => expect(galleryAPI.findPageableList).toHaveBeenCalledTimes(2));
    });

    it("reports a failed selected publish and accepts a scheduled answer without a task", async () => {
        galleryAPI.publishSelectedGalleries.mockRejectedValueOnce(new Error("rejected"));
        renderList();
        await screen.findByText("Summer");
        fireEvent.click(within(row("Summer")).getByRole("checkbox"));
        fireEvent.click(await screen.findByText("Publish selected galleries (1)"));
        await waitFor(() => expect(message.error).toHaveBeenCalledWith("Failed to publish selected galleries"));

        galleryAPI.publishSelectedGalleries.mockResolvedValueOnce({result: "OK", message: "", timestamp: "", task: null});
        fireEvent.click(await screen.findByText("Publish selected galleries (1)"));
        await waitFor(() => expect(message.success).toHaveBeenCalledWith("Selected galleries publishing started"));
        expect(trackTask).not.toHaveBeenCalled();
    });

    it("refreshes all gallery files as a background task and reports its outcome", async () => {
        renderList();
        await screen.findByText("Summer");
        fireEvent.click(screen.getByText("Refresh all gallery files"));
        await waitFor(() => expect(fileSystemAPI.refreshAllGalleryFiles).toHaveBeenCalledTimes(1));
        expect(window.confirm).toHaveBeenCalledWith("Are you sure you want to refresh all 2 galleries?");
        await waitFor(() => expect(message.info).toHaveBeenCalledWith("Refresh of all gallery files started"));
        const options = trackTask.mock.calls[0][1] as { onFinished: (task: unknown) => void };

        options.onFinished({status: "COMPLETED", result: {result: "OK", details: []}});
        expect(message.success).toHaveBeenCalledWith("Gallery files refreshed successfully");
        await waitFor(() => expect(galleryAPI.findPageableList).toHaveBeenCalledTimes(2));

        options.onFinished({status: "COMPLETED", result: {result: "FAIL", details: [{result_description: "missing"}, {result_description: "broken"}]}});
        expect(message.error).toHaveBeenCalledWith("Failed to refresh the gallery files, details: missing, broken");
        options.onFinished({status: "FAILED", result: null, error_message: "boom"});
        expect(message.error).toHaveBeenCalledWith("Failed to refresh the gallery files, details: boom");
        options.onFinished({status: "CANCELLED", result: null, error_message: null});
        expect(message.error).toHaveBeenCalledWith("Failed to refresh the gallery files, details: ");
    });

    it("shows the synchronous refresh result and failures", async () => {
        fileSystemAPI.refreshAllGalleryFiles.mockResolvedValueOnce({result: "OK", refreshed_items: 1, failed_items: 0, details: [], task: null});
        renderList();
        await screen.findByText("Summer");
        fireEvent.click(screen.getByText("Refresh all gallery files"));
        expect(await screen.findByText("Gallery files refreshed successfully")).toBeInTheDocument();
        expect(screen.getByText("Back").closest("a")).toHaveAttribute("href", "/galleries");

        fileSystemAPI.refreshAllGalleryFiles.mockResolvedValueOnce({
            result: "FAIL",
            refreshed_items: 0,
            failed_items: 1,
            details: [{result: "FAIL", item_id: 1, item_type: "FILE", result_description: "gone"}],
            task: null
        });
        renderList();
        fireEvent.click((await screen.findAllByText("Refresh all gallery files")).at(-1) as HTMLElement);
        expect(await screen.findByText("Failed to refresh the gallery files, details: gone")).toBeInTheDocument();

        fileSystemAPI.refreshAllGalleryFiles.mockRejectedValueOnce(new Error("rejected"));
        renderList();
        fireEvent.click((await screen.findAllByText("Refresh all gallery files")).at(-1) as HTMLElement);
        expect(await screen.findByText("Failed to refresh the gallery files, try again later")).toBeInTheDocument();

        galleryAPI.publishAll.mockRejectedValueOnce(new Error("rejected"));
        renderList();
        fireEvent.click((await screen.findAllByText("Publish all galleries")).at(-1) as HTMLElement);
        await waitFor(() => expect(console.error).toHaveBeenCalledWith("Error publishing all galleries"));
    });
});
