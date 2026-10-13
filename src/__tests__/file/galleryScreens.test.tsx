import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {GalleryDelete} from "../../file/GalleryDelete";
import {GalleryPublish} from "../../file/GalleryPublish";
import {GalleryRefresh} from "../../file/GalleryRefresh";
import {SiteFileCard} from "../../file/SiteFileCard";
import {SiteFileList} from "../../file/SiteFileList";
import {FileTypeEnum, type SiteFileResponse} from "../../models";
import {galleryResponse, pagedResponse, siteFile} from "../helpers/testData";
import {renderAt} from "../helpers/renderUtils";

const galleryAPI = {findById: jest.fn(), delete: jest.fn(), publish: jest.fn()};
const fileSystemAPI = {refreshGalleryFiles: jest.fn()};
const siteFileAPI = {getPagedSiteFiles: jest.fn()};
const trackTask = jest.fn();

jest.mock("@vempain/vempain-common-frontend", () => ({
    useTaskProgress: () => ({trackTask: (...args: unknown[]) => trackTask(...args)})
}));

jest.mock("../../services", () => ({
    userAPI: {findById: jest.fn(async () => ({id: 1, name: "Admin", nick: "admin"}))},
    galleryAPI: {
        findById: (...a: unknown[]) => galleryAPI.findById(...a),
        delete: (...a: unknown[]) => galleryAPI.delete(...a),
        publish: (...a: unknown[]) => galleryAPI.publish(...a)
    },
    fileSystemAPI: {refreshGalleryFiles: (...a: unknown[]) => fileSystemAPI.refreshGalleryFiles(...a)},
    siteFileAPI: {getPagedSiteFiles: (...a: unknown[]) => siteFileAPI.getPagedSiteFiles(...a)}
}));

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    galleryAPI.findById.mockResolvedValue(galleryResponse({site_files: [siteFile({id: 22, file_name: "beach.jpg"}), siteFile()]}));
    galleryAPI.delete.mockResolvedValue(true);
    galleryAPI.publish.mockResolvedValue({result: "OK", message: "", timestamp: "", task: null});
    fileSystemAPI.refreshGalleryFiles.mockResolvedValue({result: "OK", refreshed_items: 2, failed_items: 0, details: []});
});

afterEach(() => jest.restoreAllMocks());

describe("GalleryDelete", () => {
    const route = {route: "/galleries/12/delete", path: "/galleries/:paramId/delete"};

    it("lists the files of the gallery and deletes it", async () => {
        renderAt(<GalleryDelete/>, route);
        expect(await screen.findByText("List of files associated with the gallery")).toBeInTheDocument();
        expect(screen.getByText("sunset.jpg")).toBeInTheDocument();
        expect(screen.getByText("beach.jpg")).toBeInTheDocument();
        await waitFor(() => expect(screen.getAllByText("Admin (admin)").length).toBe(2));
        expect(screen.getAllByText(/2026-01-02 /).length).toBe(2);

        fireEvent.click(screen.getByText("Delete gallery"));
        await waitFor(() => expect(galleryAPI.delete).toHaveBeenCalledWith(12));
        expect(await screen.findByText("Gallery deleted successfully")).toBeInTheDocument();
        expect(screen.getByText("Back").closest("a")).toHaveAttribute("href", "/galleries");
    });

    it("renders no table for a gallery without files and reports failures", async () => {
        galleryAPI.findById.mockResolvedValueOnce(galleryResponse({site_files: []}));
        galleryAPI.delete.mockRejectedValueOnce(new Error("locked"));
        renderAt(<GalleryDelete/>, route);
        await screen.findByText("List of files associated with the gallery");
        expect(document.querySelector("table")).toBeNull();
        fireEvent.click(screen.getByText("Delete gallery"));
        expect(await screen.findByText("Failed to delete the gallery, try again later")).toBeInTheDocument();

        galleryAPI.findById.mockRejectedValueOnce(new Error("down"));
        renderAt(<GalleryDelete/>, route);
        expect(await screen.findByText("Failed to fetch the gallery details, try again later")).toBeInTheDocument();

        renderAt(<GalleryDelete/>, {route: "/galleries/-1/delete", path: route.path});
        expect(screen.getByText("Called with invalid parameter")).toBeInTheDocument();

        renderAt(<GalleryDelete/>, {route: "/galleries/0/delete", path: route.path});
        expect(galleryAPI.findById).toHaveBeenCalledTimes(2);
    });
});

describe("GalleryPublish", () => {
    const route = {route: "/galleries/12/publish", path: "/galleries/:paramId/publish"};

    it("shows the gallery with its files sorted by id and starts the publishing task", async () => {
        galleryAPI.publish.mockResolvedValue({
            result: "OK",
            message: "",
            timestamp: "",
            task: {task_id: "t2", type: "PUBLISH_GALLERY", title: "g", status: "QUEUED", total_steps: 2}
        });
        renderAt(<GalleryPublish/>, route);

        expect(await screen.findByDisplayValue("Summer")).toBeDisabled();
        expect(screen.getAllByDisplayValue("Summer pictures")[0]).toBeDisabled();
        const names = screen.getAllByText(/\.jpg$/).map(element => element.textContent);
        expect(names).toEqual(["sunset.jpg", "beach.jpg"]);

        fireEvent.change(document.querySelectorAll("textarea.ant-input")[1] as HTMLElement, {target: {value: "Album online"}});
        fireEvent.click(screen.getAllByText("Publish gallery")[1]);
        await waitFor(() => expect(galleryAPI.publish).toHaveBeenCalledWith({
            id: 12,
            publish_message: "Album online",
            publish_schedule: false,
            publish_date_time: null
        }));
        expect(trackTask).toHaveBeenCalledWith(expect.objectContaining({task_id: "t2"}));
        expect(await screen.findByText("Gallery publishing started, follow it in the task tray")).toBeInTheDocument();
    });

    it("schedules the publishing without a task", async () => {
        galleryAPI.findById.mockResolvedValueOnce(galleryResponse({site_files: []}));
        renderAt(<GalleryPublish/>, route);
        await screen.findByDisplayValue("Summer");
        fireEvent.click(screen.getByRole("switch"));
        fireEvent.click(screen.getAllByText("Publish gallery")[0]);
        await waitFor(() => expect(galleryAPI.publish).toHaveBeenCalledTimes(1));
        expect(galleryAPI.publish.mock.calls[0][0]).toMatchObject({id: 12, publish_schedule: true});
        expect(galleryAPI.publish.mock.calls[0][0].publish_date_time).not.toBeNull();
        expect(trackTask).not.toHaveBeenCalled();
        expect(await screen.findByText("Gallery publishing scheduled")).toBeInTheDocument();
    });

    it("reports a failed publish, a failed load and an invalid id", async () => {
        galleryAPI.publish.mockRejectedValueOnce(new Error("rejected"));
        renderAt(<GalleryPublish/>, route);
        await screen.findByDisplayValue("Summer");
        fireEvent.click(screen.getAllByText("Publish gallery")[0]);
        expect(await screen.findByText("Failed to publish the gallery, try again later")).toBeInTheDocument();

        galleryAPI.findById.mockRejectedValueOnce(new Error("down"));
        renderAt(<GalleryPublish/>, route);
        expect(await screen.findByText("Failed to fetch gallery, try again later")).toBeInTheDocument();

        renderAt(<GalleryPublish/>, {route: "/galleries/-1/publish", path: route.path});
        expect(screen.getByText("Called with invalid parameter")).toBeInTheDocument();
    });
});

describe("GalleryRefresh", () => {
    const route = {route: "/galleries/12/refresh", path: "/galleries/:paramId/refresh"};

    it("refreshes the files of the gallery", async () => {
        renderAt(<GalleryRefresh/>, route);
        expect(await screen.findByText("Refreshing 'Summer' gallery files")).toBeInTheDocument();
        expect(screen.getByText("beach.jpg")).toBeInTheDocument();
        fireEvent.click(screen.getAllByText("Refresh gallery files")[1]);
        await waitFor(() => expect(fileSystemAPI.refreshGalleryFiles).toHaveBeenCalledWith(12));
        expect(await screen.findByText("Gallery files refreshed successfully")).toBeInTheDocument();
        expect(screen.getByText("Back").closest("a")).toHaveAttribute("href", "/galleries");
    });

    it("reports refresh details, a rejected refresh, a failed load and an invalid id", async () => {
        fileSystemAPI.refreshGalleryFiles.mockResolvedValueOnce({
            result: "FAIL", refreshed_items: 0, failed_items: 1,
            details: [{result: "FAIL", item_id: 21, item_type: "FILE", result_description: "missing on disk"}, {
                result: "FAIL",
                item_id: 22,
                item_type: "FILE",
                result_description: "checksum"
            }]
        });
        galleryAPI.findById.mockResolvedValueOnce(galleryResponse({site_files: []}));
        renderAt(<GalleryRefresh/>, route);
        fireEvent.click((await screen.findAllByText("Refresh gallery files"))[0]);
        expect(await screen.findByText("Failed to refresh the gallery files, details: missing on disk, checksum")).toBeInTheDocument();

        fileSystemAPI.refreshGalleryFiles.mockRejectedValueOnce(new Error("rejected"));
        renderAt(<GalleryRefresh/>, route);
        await screen.findByText("Refreshing 'Summer' gallery files");
        fireEvent.click(screen.getAllByText("Refresh gallery files")[0]);
        expect(await screen.findByText("Failed to publish the gallery, try again later")).toBeInTheDocument();

        galleryAPI.findById.mockRejectedValueOnce(new Error("down"));
        renderAt(<GalleryRefresh/>, route);
        expect(await screen.findByText("Failed to fetch gallery, try again later")).toBeInTheDocument();

        renderAt(<GalleryRefresh/>, {route: "/galleries/-1/refresh", path: route.path});
        expect(screen.getByText("Called with invalid parameter")).toBeInTheDocument();
    });
});

describe("SiteFileCard", () => {
    it("shows the summary, the details and the parsed metadata", () => {
        const file = siteFile({
            metadata: JSON.stringify({Comment: "a comment", EXIF: {Make: "Canon", ISO: 100}}),
            location: {latitude: 60.1, longitude: 24.9} as unknown as SiteFileResponse["location"],
            modified: "2026-01-03T11:30:00.250Z"
        });
        render(<SiteFileCard siteFile={{...file, file_class: "IMAGE"} as SiteFileResponse}/>);

        expect(screen.getByText("File Name")).toBeInTheDocument();
        expect(screen.getByText("sunset.jpg")).toBeInTheDocument();
        expect(screen.getByText("2.000 KB")).toBeInTheDocument();
        fireEvent.click(screen.getByText("Details"));
        expect(screen.getByText("Original Date Time")).toBeInTheDocument();
        expect(screen.getByText(/2026-01-03 \d\d:30:00:250/)).toBeInTheDocument();
        expect(screen.getByText("IMAGE", {selector: ".ant-tag"})).toBeInTheDocument();
        expect(screen.getByText(/"latitude": 60.1/)).toBeInTheDocument();
        expect(screen.getByText("Metadata")).toBeInTheDocument();
    });

    it("keeps unparsable metadata as raw text and unwraps array metadata", () => {
        render(<SiteFileCard siteFile={siteFile({metadata: "{broken"})}/>);
        fireEvent.click(screen.getByText("Details"));
        expect(screen.getByText("Metadata")).toBeInTheDocument();

        const {unmount} = render(<SiteFileCard siteFile={siteFile({id: 30, metadata: JSON.stringify([{Title: "first"}])})}/>);
        expect(screen.getAllByText("Details").length).toBe(2);
        unmount();

        render(<SiteFileCard siteFile={siteFile({id: 31, metadata: "null"})}/>);
        render(<SiteFileCard siteFile={{...siteFile({id: 32}), metadata: undefined} as unknown as SiteFileResponse}/>);
    });
});

describe("SiteFileList", () => {
    it("lists the site files of the given type with formatted columns", async () => {
        siteFileAPI.getPagedSiteFiles.mockResolvedValue(pagedResponse([
            siteFile({modified: "2026-01-03T11:30:00.250Z"}),
            siteFile({id: 22, file_name: "beach.jpg", file_type: undefined as unknown as FileTypeEnum})
        ]));
        render(<SiteFileList fileType={FileTypeEnum.IMAGE} title="Image Files"/>);

        expect(screen.getByRole("heading", {name: "Image Files"})).toBeInTheDocument();
        expect(await screen.findByText("sunset.jpg")).toBeInTheDocument();
        expect(siteFileAPI.getPagedSiteFiles).toHaveBeenCalledWith(expect.objectContaining({
            page: 0,
            size: 15,
            sort_by: "id",
            direction: "ASC",
            file_type: "IMAGE"
        }));
        const row = screen.getByText("sunset.jpg").closest("tr") as HTMLElement;
        await waitFor(() => expect(within(row).getByText("Admin (admin)")).toBeInTheDocument());
        expect(within(row).getByText("2.000 KB")).toBeInTheDocument();
        expect(within(row).getByText("IMAGE", {selector: ".ant-tag"})).toBeInTheDocument();
        expect(within(row).getByText(/2026-01-03 \d\d:30:00:250/)).toBeInTheDocument();
        const other = screen.getByText("beach.jpg").closest("tr") as HTMLElement;
        expect(other.querySelector(".ant-tag")).toBeNull();

        fireEvent.click(screen.getByText("File name"));
        await waitFor(() => expect(siteFileAPI.getPagedSiteFiles).toHaveBeenLastCalledWith(expect.objectContaining({sort_by: "file_name"})));
    });

    it("renders without a title", async () => {
        siteFileAPI.getPagedSiteFiles.mockResolvedValue(pagedResponse([]));
        render(<SiteFileList fileType={FileTypeEnum.AUDIO}/>);
        await waitFor(() => expect(siteFileAPI.getPagedSiteFiles).toHaveBeenCalledWith(expect.objectContaining({file_type: "AUDIO"})));
        expect(screen.queryByRole("heading")).toBeNull();
    });
});
