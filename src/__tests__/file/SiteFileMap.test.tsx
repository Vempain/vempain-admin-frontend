import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {SiteFileMap} from "../../file/SiteFileMap";
import {formatCoordinates} from "../../tools/mapFileTools";
import {SiteFileThumbnail} from "../../file/SiteFileThumbnail";
import {siteFileAPI, tagAPI} from "../../services";

// The shared map view of the common library is its contract stub (__mocks__/@vempain/vempain-common-frontend.tsx)
jest.mock("@vempain/vempain-common-frontend", () => jest.requireActual("../../../__mocks__/@vempain/vempain-common-frontend"));

jest.mock("../../services", () => ({
    mapAPI: {getClusters: jest.fn(), getClusterFiles: jest.fn()},
    tagAPI: {search: jest.fn()},
    siteFileAPI: {getThumbnail: jest.fn()}
}));

const search = jest.mocked(tagAPI.search);
const getThumbnail = jest.mocked(siteFileAPI.getThumbnail);

describe("SiteFileMap", () => {
    beforeEach(() => {
        search.mockReset();
        getThumbnail.mockReset();
        search.mockResolvedValue([{id: 1, tag_name: "summer"}, {id: 2, tag_name: "sunset"}] as never);
        getThumbnail.mockResolvedValue(new Blob(["x"], {type: "image/jpeg"}));
        Object.defineProperty(URL, "createObjectURL", {writable: true, value: jest.fn(() => "blob:thumb")});
        Object.defineProperty(URL, "revokeObjectURL", {writable: true, value: jest.fn()});
    });

    it("mounts the shared map over the admin backend's map API with every file type but thumbnails, the tiles and the tag search", async () => {
        render(<SiteFileMap/>);

        expect(screen.getByText("Map of site files")).toBeInTheDocument();
        const view = screen.getByTestId("map-view");
        expect(view.dataset.source).toBe("set");
        expect(view.dataset.fileTypes?.split(",")).toEqual(expect.arrayContaining(["IMAGE", "VIDEO", "DOCUMENT"]));
        expect(view.dataset.fileTypes).not.toContain("THUMB");
        expect(view.dataset.tileUrl).toContain("tile.openstreetmap.org");

        fireEvent.click(screen.getByText("stub: search tags"));
        await waitFor(() => expect(screen.getByTestId("map-stub-tags").textContent).toBe("summer,sunset"));
        expect(search).toHaveBeenCalledWith("sum");
    });

    it("shows a clicked site file with its thumbnail from the admin backend and its details", async () => {
        render(<SiteFileMap/>);

        fireEvent.click(screen.getByText("stub: open file"));

        await waitFor(() => expect(getThumbnail).toHaveBeenCalledWith(42));
        expect(await screen.findByAltText("Site file 42")).toHaveAttribute("src", "blob:thumb");
        const details = screen.getByTestId("site-file-map-details");
        expect(details).toHaveTextContent("stub.jpg");
        expect(details).toHaveTextContent("/stub");
        expect(details).toHaveTextContent("IMAGE");
        expect(details).toHaveTextContent("60.17123 N, 24.94156 W");
    });

    it("tells when a site file has no thumbnail", async () => {
        getThumbnail.mockRejectedValue(new Error("404"));
        render(<SiteFileThumbnail siteFileId={9}/>);

        expect(await screen.findByTestId("site-file-thumbnail-missing")).toHaveTextContent("No thumbnail");
    });

    it("prints the coordinates as value and hemisphere", () => {
        expect(formatCoordinates({id: 1, filename: "a", file_path: "/", file_type: "IMAGE", mimetype: "image/jpeg", latitude: -33.9, longitude: 151.2,
            original_datetime: null, thumbnail_id: null})).toBe("33.90000 S, 151.20000 E");
    });
});
