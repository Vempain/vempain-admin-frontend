import {fireEvent, screen, waitFor} from "@testing-library/react";
import {GalleryEdit} from "../../file/GalleryEdit";
import {galleryResponse, pagedResponse, SESSION_USER_ID, siteFile} from "../helpers/testData";
import {renderAt, selectOption} from "../helpers/renderUtils";

const useSession = jest.fn();
const galleryAPI = {findById: jest.fn(), create: jest.fn(), update: jest.fn()};
const siteFileAPI = {getPagedSiteFiles: jest.fn()};
const aclEdit = jest.fn();

jest.mock("@vempain/vempain-auth-frontend", () => ({
    ...jest.requireActual("@vempain/vempain-auth-frontend"),
    useSession: () => useSession()
}));

jest.mock("../../services", () => ({
    galleryAPI: {
        findById: (...a: unknown[]) => galleryAPI.findById(...a),
        create: (...a: unknown[]) => galleryAPI.create(...a),
        update: (...a: unknown[]) => galleryAPI.update(...a)
    },
    siteFileAPI: {getPagedSiteFiles: (...a: unknown[]) => siteFileAPI.getPagedSiteFiles(...a)}
}));

// The ACL rows live in the parent form's `acls` field, as with the shared editor
jest.mock("../../content", () => {
    const {Form} = jest.requireActual("antd");
    const AclField = () => <div data-testid="acl-edit"/>;
    return {
        ...jest.requireActual("../../content"),
        AclEdit: (props: { acls: unknown[] }) => {
            aclEdit(props);
            return <Form.Item name="acls" noStyle><AclField/></Form.Item>;
        }
    };
});

const path = "/galleries/:paramId/edit";
const files = [siteFile(), siteFile({id: 22, file_name: "beach.jpg", size: 3 * 1024 * 1024}), siteFile({id: 23, file_name: "tiny.jpg", size: 512})];

async function transferOption(fileName: string): Promise<HTMLElement> {
    const names = await screen.findAllByText(fileName, {selector: ".virtual-transfer-item strong"});
    return names[0].closest("[role=option]") as HTMLElement;
}

function transferButtons(): HTMLElement[] {
    return Array.from(document.querySelectorAll(".ant-transfer-actions button"));
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    useSession.mockReturnValue({userSession: {id: SESSION_USER_ID}});
    galleryAPI.findById.mockResolvedValue(galleryResponse({site_files: [files[0]]}));
    galleryAPI.create.mockResolvedValue(galleryResponse({id: 30}));
    galleryAPI.update.mockResolvedValue(galleryResponse());
    siteFileAPI.getPagedSiteFiles.mockResolvedValue(pagedResponse(files));
});

afterEach(() => jest.restoreAllMocks());

describe("GalleryEdit", () => {
    it("creates a gallery from the form and the files moved to the assigned list", async () => {
        renderAt(<GalleryEdit/>, {route: "/galleries/0/edit", path});
        expect(await screen.findByText("Create Gallery 0")).toBeInTheDocument();
        await waitFor(() => expect(siteFileAPI.getPagedSiteFiles).toHaveBeenCalledWith(expect.objectContaining({
            page: 0,
            size: 50,
            sort_by: "id",
            direction: "ASC",
            file_type: "IMAGE",
            case_sensitive: false
        })));
        expect(await screen.findByText("beach.jpg")).toBeInTheDocument();
        expect(screen.getByText(/3\.00 MB/)).toBeInTheDocument();
        expect(screen.getByText(/512 B/)).toBeInTheDocument();
        expect(screen.getByText(/2\.00 KB/)).toBeInTheDocument();
        expect(screen.getByText("0 resources selected")).toBeInTheDocument();
        expect(aclEdit.mock.calls.at(-1)[0].acls).toEqual([]);

        fireEvent.change(screen.getByLabelText("Short Name"), {target: {value: "Trip"}});
        fireEvent.change(screen.getByLabelText("Description"), {target: {value: "Road trip"}});
        fireEvent.click(await transferOption("beach.jpg"));
        fireEvent.click(transferButtons()[0]);
        expect(await screen.findByText("1 resource selected")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", {name: "Create"}));
        await waitFor(() => expect(galleryAPI.create).toHaveBeenCalledTimes(1));
        expect(galleryAPI.create.mock.calls[0][0]).toMatchObject({id: 0, short_name: "Trip", description: "Road trip", site_files_id: [22], acls: []});
        expect(await screen.findByText("Gallery created")).toBeInTheDocument();
        expect(screen.getByText("Back").closest("a")).toHaveAttribute("href", "/galleries");
    });

    it("refuses to create a gallery without the required fields", async () => {
        renderAt(<GalleryEdit/>, {route: "/galleries/0/edit", path});
        await screen.findByText("Create Gallery 0");
        fireEvent.click(screen.getByRole("button", {name: "Create"}));
        expect(await screen.findByText("Please enter the short name")).toBeInTheDocument();
        expect(screen.getByText("Please enter the description")).toBeInTheDocument();
        expect(galleryAPI.create).not.toHaveBeenCalled();
    });

    it("updates an existing gallery, keeps its files selected and resets the form", async () => {
        renderAt(<GalleryEdit/>, {route: "/galleries/12/edit", path});
        expect(await screen.findByText("Update Gallery 12")).toBeInTheDocument();
        expect(await screen.findByDisplayValue("Summer")).toBeInTheDocument();
        expect(await screen.findByText("1 resource selected")).toBeInTheDocument();
        expect(aclEdit.mock.calls.at(-1)[0].acls).toHaveLength(1);

        fireEvent.change(screen.getByLabelText("Short Name"), {target: {value: "Changed"}});
        fireEvent.click(screen.getByRole("button", {name: "Reset"}));
        await waitFor(() => expect(screen.getByLabelText("Short Name")).toHaveValue("Summer"));

        fireEvent.click(await transferOption("sunset.jpg"));
        fireEvent.click(transferButtons()[1]);
        expect(await screen.findByText("0 resources selected")).toBeInTheDocument();
        fireEvent.click(await transferOption("tiny.jpg"));
        fireEvent.click(transferButtons()[0]);
        expect(await screen.findByText("1 resource selected")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", {name: "Update"}));
        await waitFor(() => expect(galleryAPI.update).toHaveBeenCalledTimes(1));
        const payload = galleryAPI.update.mock.calls[0][0];
        expect(payload).toMatchObject({id: 12, short_name: "Summer", site_files_id: [23]});
        expect(payload.acls[0]).toMatchObject({user: SESSION_USER_ID, read_privilege: true});
        expect(await screen.findByText("Gallery updated")).toBeInTheDocument();
    });

    it("searches, sorts and filters the site files and loads more pages", async () => {
        siteFileAPI.getPagedSiteFiles.mockResolvedValue(pagedResponse([files[0]], {total_pages: 2, total_elements: 3, last: false}));
        renderAt(<GalleryEdit/>, {route: "/galleries/0/edit", path});
        await screen.findByText("Create Gallery 0");
        await screen.findByText("sunset.jpg");

        const search = screen.getByPlaceholderText("Search site files");
        fireEvent.change(search, {target: {value: "sun"}});
        fireEvent.keyDown(search, {key: "Enter", code: "Enter"});
        await waitFor(() => expect(siteFileAPI.getPagedSiteFiles).toHaveBeenLastCalledWith(expect.objectContaining({search: "sun"})));
        fireEvent.change(search, {target: {value: ""}});
        await waitFor(() => expect(siteFileAPI.getPagedSiteFiles).toHaveBeenLastCalledWith(expect.objectContaining({search: undefined})));

        const selects = screen.getAllByRole("combobox");
        await selectOption(selects[0], "File path");
        await waitFor(() => expect(siteFileAPI.getPagedSiteFiles).toHaveBeenLastCalledWith(expect.objectContaining({sort_by: "filepath"})));
        await selectOption(selects[1], "Subject");
        await waitFor(() => expect(siteFileAPI.getPagedSiteFiles).toHaveBeenLastCalledWith(expect.objectContaining({filter_column: "subject"})));
        await selectOption(selects[2], "Audio");
        await waitFor(() => expect(siteFileAPI.getPagedSiteFiles).toHaveBeenLastCalledWith(expect.objectContaining({file_type: "AUDIO"})));
        await selectOption(selects[3], "Descending");
        await waitFor(() => expect(siteFileAPI.getPagedSiteFiles).toHaveBeenLastCalledWith(expect.objectContaining({direction: "DESC"})));
        fireEvent.click(screen.getByRole("switch"));
        await waitFor(() => expect(siteFileAPI.getPagedSiteFiles).toHaveBeenLastCalledWith(expect.objectContaining({case_sensitive: true})));

        siteFileAPI.getPagedSiteFiles.mockResolvedValueOnce(pagedResponse([files[1]], {page: 1, total_pages: 2, total_elements: 3, last: true}));
        fireEvent.click(await screen.findByText(/Load more resources/));
        await waitFor(() => expect(siteFileAPI.getPagedSiteFiles).toHaveBeenLastCalledWith(expect.objectContaining({page: 1})));
        expect(await screen.findByText("beach.jpg")).toBeInTheDocument();
        expect(screen.getByText("sunset.jpg")).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByText(/Load more resources/)).toBeNull());
    });

    it("stops when no site files exist, and reports failed saves, a failed load and an invalid id", async () => {
        siteFileAPI.getPagedSiteFiles.mockResolvedValueOnce(pagedResponse([]));
        renderAt(<GalleryEdit/>, {route: "/galleries/0/edit", path});
        expect(await screen.findByText("No site files found, cannot proceed")).toBeInTheDocument();

        siteFileAPI.getPagedSiteFiles.mockRejectedValueOnce(new Error("down"));
        galleryAPI.create.mockRejectedValueOnce(new Error("rejected"));
        renderAt(<GalleryEdit/>, {route: "/galleries/0/edit", path});
        await screen.findByText("Create Gallery 0");
        await waitFor(() => expect(console.error).toHaveBeenCalledWith("Failed to fetch site files page info:", expect.any(Error)));
        fireEvent.change(screen.getByLabelText("Short Name"), {target: {value: "Trip"}});
        fireEvent.change(screen.getByLabelText("Description"), {target: {value: "Road trip"}});
        fireEvent.click(screen.getByRole("button", {name: "Create"}));
        expect(await screen.findByText("Failed to create gallery")).toBeInTheDocument();

        galleryAPI.update.mockRejectedValueOnce(new Error("rejected"));
        renderAt(<GalleryEdit/>, {route: "/galleries/12/edit", path});
        await screen.findByDisplayValue("Summer");
        fireEvent.click(screen.getByRole("button", {name: "Update"}));
        expect(await screen.findByText("Failed to update gallery")).toBeInTheDocument();

        galleryAPI.findById.mockRejectedValueOnce(new Error("down"));
        renderAt(<GalleryEdit/>, {route: "/galleries/12/edit", path});
        expect(await screen.findByText("Failed to fetch gallery")).toBeInTheDocument();

        renderAt(<GalleryEdit/>, {route: "/galleries/-1/edit", path});
        expect(screen.getByText("Called with invalid parameter")).toBeInTheDocument();
    });
});
