import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {message} from "antd";
import {MemoryRouter} from "react-router-dom";
import {SiteFileList} from "../../file/SiteFileList";
import {FileTypeEnum} from "../../models";
import {pagedResponse, siteFile} from "../helpers/testData";

const siteFileAPI = {getPagedSiteFiles: jest.fn(), publishSelectedFiles: jest.fn(), delete: jest.fn()};
const trackTask = jest.fn();

jest.mock("@vempain/vempain-common-frontend", () => ({
    useTaskProgress: () => ({trackTask: (...args: unknown[]) => trackTask(...args)})
}));

jest.mock("../../services", () => ({
    siteFileAPI: {
        getPagedSiteFiles: (...a: unknown[]) => siteFileAPI.getPagedSiteFiles(...a),
        publishSelectedFiles: (...a: unknown[]) => siteFileAPI.publishSelectedFiles(...a),
        delete: (...a: unknown[]) => siteFileAPI.delete(...a)
    },
    userAPI: {findById: jest.fn().mockResolvedValue({id: 1, nick: "alice"})}
}));

const task = {task_id: "t7", type: "PUBLISH_SELECTED_FILES", title: "Publish 1 selected files", status: "QUEUED", total_steps: 1};

function row(fileName: string): HTMLElement {
    return screen.getByText(fileName).closest("tr") as HTMLElement;
}

describe("SiteFileList", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => undefined);
        jest.spyOn(message, "success").mockImplementation(() => ({}) as never);
        jest.spyOn(message, "error").mockImplementation(() => ({}) as never);
        siteFileAPI.getPagedSiteFiles.mockResolvedValue(pagedResponse([
            siteFile(),
            siteFile({id: 22, file_name: "dawn.jpg", file_path: "/2026/dawn.jpg", published: "2026-01-05T08:00:00Z"})
        ]));
        siteFileAPI.publishSelectedFiles.mockResolvedValue({result: "OK", message: "", timestamp: "", task});
        siteFileAPI.delete.mockResolvedValue(true);
    });

    afterEach(() => jest.restoreAllMocks());

    function renderList() {
        return render(<MemoryRouter><SiteFileList fileType={FileTypeEnum.IMAGE} title="Image Files"/></MemoryRouter>);
    }

    it("lists the files of the type with a publish and a delete action on every row", async () => {
        renderList();
        expect(await screen.findByText("sunset.jpg")).toBeInTheDocument();
        expect(siteFileAPI.getPagedSiteFiles).toHaveBeenCalledWith(expect.objectContaining({file_type: "IMAGE", modified_after_publish: false}));
        expect(within(row("sunset.jpg")).getByText("Not published")).toBeInTheDocument();
        expect(within(row("sunset.jpg")).getByRole("button", {name: "Publish sunset.jpg"})).toBeInTheDocument();
        expect(within(row("sunset.jpg")).getByRole("button", {name: "Delete sunset.jpg"})).toBeInTheDocument();
        expect(within(row("dawn.jpg")).getByText(/2026-01-05 \d\d:00:00:000/)).toBeInTheDocument();
        expect(screen.getByRole("button", {name: "Publish selected files (0)"})).toBeDisabled();
    });

    it("publishes one file from its row as a background task and reloads the list once it has finished", async () => {
        renderList();
        await screen.findByText("sunset.jpg");

        fireEvent.click(within(row("sunset.jpg")).getByRole("button", {name: "Publish sunset.jpg"}));

        await waitFor(() => expect(siteFileAPI.publishSelectedFiles).toHaveBeenCalledWith({file_ids: [21]}));
        await waitFor(() => expect(trackTask).toHaveBeenCalledWith(task, expect.objectContaining({onFinished: expect.any(Function)})));
        expect(message.success).toHaveBeenCalledWith("File publishing started");
        (trackTask.mock.calls[0][1] as { onFinished: () => void }).onFinished();
        await waitFor(() => expect(siteFileAPI.getPagedSiteFiles).toHaveBeenCalledTimes(2));
    });

    it("publishes the selected files in one batch and clears the selection", async () => {
        renderList();
        await screen.findByText("sunset.jpg");
        fireEvent.click(within(row("sunset.jpg")).getByRole("checkbox"));
        fireEvent.click(within(row("dawn.jpg")).getByRole("checkbox"));
        const publishSelected = screen.getByRole("button", {name: "Publish selected files (2)"});
        expect(publishSelected).toBeEnabled();

        fireEvent.click(publishSelected);

        await waitFor(() => expect(siteFileAPI.publishSelectedFiles).toHaveBeenCalledWith({file_ids: [21, 22]}));
        expect(message.success).toHaveBeenCalledWith("Publishing of the selected files started");
        await waitFor(() => expect(screen.getByRole("button", {name: "Publish selected files (0)"})).toBeDisabled());
    });

    it("reports a failed publish without reloading", async () => {
        siteFileAPI.publishSelectedFiles.mockRejectedValue(new Error("boom"));
        renderList();
        await screen.findByText("sunset.jpg");

        fireEvent.click(within(row("sunset.jpg")).getByRole("button", {name: "Publish sunset.jpg"}));

        await waitFor(() => expect(message.error).toHaveBeenCalledWith("Failed to publish the file"));
        expect(trackTask).not.toHaveBeenCalled();
        expect(siteFileAPI.getPagedSiteFiles).toHaveBeenCalledTimes(1);
    });

    it("deletes a file after confirmation and reloads the list", async () => {
        renderList();
        await screen.findByText("sunset.jpg");

        fireEvent.click(within(row("sunset.jpg")).getByRole("button", {name: "Delete sunset.jpg"}));
        expect(await screen.findByText("Delete sunset.jpg from the admin and from the website?")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", {name: "Delete"}));

        await waitFor(() => expect(siteFileAPI.delete).toHaveBeenCalledWith(21));
        expect(message.success).toHaveBeenCalledWith("File sunset.jpg deleted");
        await waitFor(() => expect(siteFileAPI.getPagedSiteFiles).toHaveBeenCalledTimes(2));
    });

    it("does not delete when the confirmation is cancelled", async () => {
        renderList();
        await screen.findByText("sunset.jpg");

        fireEvent.click(within(row("sunset.jpg")).getByRole("button", {name: "Delete sunset.jpg"}));
        fireEvent.click(await screen.findByRole("button", {name: "Cancel"}));

        // antd keeps the closed popover in the DOM, hidden
        await waitFor(() => expect(screen.getByText("Delete sunset.jpg from the admin and from the website?").closest(".ant-popover"))
                .toHaveClass("ant-popover-hidden"));
        expect(siteFileAPI.delete).not.toHaveBeenCalled();
        expect(siteFileAPI.getPagedSiteFiles).toHaveBeenCalledTimes(1);
    });
});
