import {act, fireEvent, screen, waitFor} from "@testing-library/react";
import {PageEditor} from "../../content/PageEditor";
import {formVO, galleryResponse, pagedResponse, pageResponse, SESSION_USER_ID} from "../helpers/testData";
import {renderAt, selectOption} from "../helpers/renderUtils";

const useSession = jest.fn();
const pageAPI = {findById: jest.fn(), findPageable: jest.fn(), create: jest.fn(), update: jest.fn(), suggestPath: jest.fn()};
const formAPI = {findPageable: jest.fn()};
const galleryAPI = {findById: jest.fn(), findPageableList: jest.fn()};
const siteFileAPI = {getPagedSiteFiles: jest.fn()};
const dataAPI = {getAllDataSets: jest.fn()};
const webSiteManagementAPI = {findInternalLinks: jest.fn()};
const aclEdit = jest.fn();

jest.mock("@vempain/vempain-auth-frontend", () => ({
    ...jest.requireActual("@vempain/vempain-auth-frontend"),
    useSession: () => useSession()
}));

jest.mock("../../services", () => ({
    userAPI: {findById: jest.fn(async () => ({id: 1, name: "Admin", nick: "admin"}))},
    pageAPI: {
        findById: (...a: unknown[]) => pageAPI.findById(...a),
        findPageable: (...a: unknown[]) => pageAPI.findPageable(...a),
        create: (...a: unknown[]) => pageAPI.create(...a),
        update: (...a: unknown[]) => pageAPI.update(...a),
        suggestPath: (...a: unknown[]) => pageAPI.suggestPath(...a)
    },
    formAPI: {findPageable: (...a: unknown[]) => formAPI.findPageable(...a)},
    galleryAPI: {findById: (...a: unknown[]) => galleryAPI.findById(...a), findPageableList: (...a: unknown[]) => galleryAPI.findPageableList(...a)},
    siteFileAPI: {getPagedSiteFiles: (...a: unknown[]) => siteFileAPI.getPagedSiteFiles(...a)},
    dataAPI: {getAllDataSets: (...a: unknown[]) => dataAPI.getAllDataSets(...a)},
    webSiteManagementAPI: {findInternalLinks: (...a: unknown[]) => webSiteManagementAPI.findInternalLinks(...a)}
}));

// Like the shared editor, the stub keeps the ACL rows in the parent form's `acls` field (unless the host already registers it)
jest.mock("../../content/AclEdit", () => {
    const {Form} = jest.requireActual("antd");
    const AclField = () => <div data-testid="acl-edit"/>;
    return {
        AclEdit: (props: { acls: unknown[]; value?: unknown }) => {
            aclEdit(props);
            return "value" in props ? <AclField/> : <Form.Item name="acls" noStyle><AclField/></Form.Item>;
        }
    };
});

const {rtEditorTestHooks} = jest.requireActual("@vempain/vempain-rt-editor") as {
    rtEditorTestHooks: { dataProviders?: Record<string, (params?: unknown) => Promise<unknown>> }
};

const path = "/pages/:paramId/edit";
const otherPages = [pageResponse({id: 1, page_path: "/"}), pageResponse({id: 2, page_path: "/about"})];

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    jest.spyOn(console, "debug").mockImplementation(() => undefined);
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    useSession.mockReturnValue({userSession: {id: SESSION_USER_ID}});
    pageAPI.findById.mockResolvedValue(pageResponse({body: "<p>Hello</p><script>x()</script><!--vps:embed:gallery:12-->", tags: ["travel", "finland"]}));
    pageAPI.findPageable.mockResolvedValue(pagedResponse(otherPages, {last: false}));
    pageAPI.create.mockImplementation(async (values: unknown) => ({...(values as object), id: 20}));
    pageAPI.update.mockImplementation(async (values: unknown) => values);
    pageAPI.suggestPath.mockResolvedValue({prefix: "", suggestion: null, matches: 0});
    formAPI.findPageable.mockResolvedValue(pagedResponse([formVO(), formVO({id: 6, name: "Gallery form"})]));
    galleryAPI.findById.mockImplementation(async (id: number) => galleryResponse({id, short_name: id === 12 ? "Summer" : "Winter"}));
    galleryAPI.findPageableList.mockResolvedValue(pagedResponse([]));
    siteFileAPI.getPagedSiteFiles.mockResolvedValue(pagedResponse([]));
    dataAPI.getAllDataSets.mockResolvedValue([]);
});

afterEach(() => jest.restoreAllMocks());

describe("PageEditor", () => {
    it("creates a page owned by the signed-in user with the galleries embedded in the body", async () => {
        renderAt(<PageEditor/>, {route: "/pages/0/edit", path});
        expect(await screen.findByText("Create new page")).toBeInTheDocument();
        await screen.findByTestId("rich-text-editor");
        expect(aclEdit.mock.calls.at(-1)[0].acls).toEqual([expect.objectContaining({user: SESSION_USER_ID, create_privilege: true, delete_privilege: true})]);
        expect(screen.getByText("No galleries embedded in the body")).toBeInTheDocument();

        await selectOption(screen.getByLabelText("Form"), "Article form");
        fireEvent.change(screen.getByLabelText("Title"), {target: {value: "Holiday"}});
        fireEvent.change(screen.getByLabelText("Header"), {target: {value: "Summer holiday"}});
        fireEvent.change(screen.getByTestId("rich-text-editor"), {
            target: {value: "<p>Pics</p><!--vps:embed:gallery:12--><!--vps:embed:carousel:[{\"title\":\"a\",\"body\":\"b\"}]:true:false:500--><!--vps:embed:hero:13:type:carousel--><!--vps:embed:hero:14:type:image-->"}
        });
        expect(await screen.findByTestId("page-gallery-12")).toHaveTextContent("Summer");
        expect(await screen.findByTestId("page-gallery-13")).toHaveTextContent("Winter");
        expect(screen.queryByText("No galleries embedded in the body")).toBeNull();
        expect(screen.queryByTestId("page-gallery-14")).toBeNull();

        fireEvent.click(screen.getByText("Save page"));
        await waitFor(() => expect(pageAPI.create).toHaveBeenCalledTimes(1));
        const payload = pageAPI.create.mock.calls[0][0];
        expect(payload).toMatchObject({id: 0, form_id: 5, title: "Holiday", header: "Summer holiday", gallery_ids: [12, 13]});
        expect(payload.body).toContain("<!--vps:embed:gallery:12-->");
        expect(payload.acls[0]).toMatchObject({user: SESSION_USER_ID});
        expect(await screen.findByText("Page created")).toBeInTheDocument();
        expect(screen.getByText("Back").closest("a")).toHaveAttribute("href", "/pages");
    });

    it("refuses to save without a valid form", async () => {
        useSession.mockReturnValue({userSession: null});
        renderAt(<PageEditor/>, {route: "/pages/0/edit", path});
        await screen.findByTestId("rich-text-editor");
        expect(aclEdit.mock.calls.at(-1)[0].acls).toEqual([]);
        fireEvent.click(screen.getByText("Save page"));
        expect(await screen.findByText("Please select a valid form")).toBeInTheDocument();
        expect(pageAPI.create).not.toHaveBeenCalled();
    });

    it("edits an existing page with its body sanitized and shows the ids of unreadable galleries", async () => {
        galleryAPI.findById.mockRejectedValue(new Error("forbidden"));
        renderAt(<PageEditor/>, {route: "/pages/9/edit", path});
        expect(await screen.findByText("Edit page 'First page'")).toBeInTheDocument();
        const editor = await screen.findByTestId("rich-text-editor");
        expect(editor).toHaveValue("<p>Hello</p><!--vps:embed:gallery:12-->");
        expect(await screen.findByTestId("page-gallery-12")).toHaveTextContent("#12");
        await waitFor(() => expect(screen.getAllByText("Admin (admin)").length).toBe(2));

        fireEvent.click(screen.getByText("Save page"));
        await waitFor(() => expect(pageAPI.update).toHaveBeenCalledTimes(1));
        expect(pageAPI.update.mock.calls[0][0]).toMatchObject({id: 9, title: "First page", gallery_ids: [12], tags: ["travel", "finland"]});
        expect(await screen.findByText("Page updated")).toBeInTheDocument();
    });

    it("searches and pages the parent page options", async () => {
        renderAt(<PageEditor/>, {route: "/pages/9/edit", path});
        await screen.findByTestId("rich-text-editor");
        const parentSelect = screen.getByLabelText("Parent Page");

        fireEvent.mouseDown(parentSelect);
        expect(await screen.findByTitle("/about")).toBeInTheDocument();
        fireEvent.change(parentSelect, {target: {value: "abo"}});
        await waitFor(() => expect(pageAPI.findPageable).toHaveBeenLastCalledWith({page: 0, size: 50, sort_by: "page_path", direction: "ASC", search: "abo"}));
        // The next page is only requested once the search request has settled
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
        });

        pageAPI.findPageable.mockResolvedValueOnce(pagedResponse([pageResponse({id: 3, page_path: "/about/team"})], {page: 1, last: true}));
        const holder = document.querySelector(".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-dropdown-list-holder") as HTMLElement;
        Object.defineProperty(holder, "scrollHeight", {configurable: true, value: 300});
        Object.defineProperty(holder, "clientHeight", {configurable: true, value: 100});
        Object.defineProperty(holder, "scrollTop", {configurable: true, writable: true, value: 200});
        fireEvent.scroll(holder);
        await waitFor(() => expect(pageAPI.findPageable).toHaveBeenLastCalledWith(expect.objectContaining({page: 1, search: "abo"})));
        expect(await screen.findByTitle("/about/team")).toBeInTheDocument();

        holder.scrollTop = 0;
        fireEvent.scroll(holder);
        fireEvent.click(screen.getByTitle("/about"));
        fireEvent.click(screen.getByText("Save page"));
        await waitFor(() => expect(pageAPI.update).toHaveBeenCalledWith(expect.objectContaining({parent_id: 2})));
    });

    it("wires the embed data providers to the services", async () => {
        renderAt(<PageEditor/>, {route: "/pages/0/edit", path});
        await screen.findByTestId("rich-text-editor");
        const providers = rtEditorTestHooks.dataProviders as Record<string, (params?: unknown) => Promise<unknown>>;

        await providers.findGalleries({page: 0, size: 10});
        expect(galleryAPI.findPageableList).toHaveBeenCalledWith({page: 0, size: 10});
        await providers.getAllDataSets({type: "time_series", search: "gps"});
        expect(dataAPI.getAllDataSets).toHaveBeenCalledWith({type: "time_series", search: "gps"});

        // The link dialog gets the published pages and files as website hrefs
        webSiteManagementAPI.findInternalLinks.mockResolvedValue([
            {type: "PAGE", title: "About us", path: "about"},
            {type: "SITE_FILE", title: "document/2024/trip report.pdf", path: "document/2024/trip report.pdf"}
        ]);
        expect(await providers.findInternalLinks({search: "ab", limit: 20})).toEqual([
            {href: "/pages/about", label: "About us", kind: "page"},
            {href: "/file/document/2024/trip%20report.pdf", label: "document/2024/trip report.pdf", kind: "file"}
        ]);
        expect(webSiteManagementAPI.findInternalLinks).toHaveBeenCalledWith("ab", 20);

        await providers.getPagedSiteFiles({
            page: "1",
            size: 20,
            file_type: "IMAGE",
            sort_by: "fileName",
            filter_column: "fileName",
            direction: "DESC",
            search: "sun"
        });
        expect(siteFileAPI.getPagedSiteFiles).toHaveBeenLastCalledWith({
            page: 1, size: 20, sort_by: "file_name", direction: "DESC", search: "sun", file_type: "IMAGE", filter_column: "file_name"
        });
        await providers.getPagedSiteFiles({page: 0, size: 20, file_type: "IMAGE", sort_by: "size", filter_column: "mimetype"});
        expect(siteFileAPI.getPagedSiteFiles).toHaveBeenLastCalledWith(expect.objectContaining({sort_by: "size", direction: "ASC", filter_column: "mimetype"}));
        await providers.getPagedSiteFiles({page: 0, size: 20, file_type: "IMAGE"});
        expect(siteFileAPI.getPagedSiteFiles).toHaveBeenLastCalledWith(expect.objectContaining({sort_by: "file_name", filter_column: "file_name"}));

        expect(() => providers.getPagedSiteFiles({size: 20, file_type: "IMAGE"})).toThrow("page number");
        expect(() => providers.getPagedSiteFiles({page: 0, file_type: "IMAGE"})).toThrow("page size");
        expect(() => providers.getPagedSiteFiles({page: 0, size: 20})).toThrow("file type");
    });

    it("reports failed saves and loads and rejects an invalid id", async () => {
        pageAPI.create.mockRejectedValueOnce(new Error("rejected"));
        renderAt(<PageEditor/>, {route: "/pages/0/edit", path});
        await screen.findByTestId("rich-text-editor");
        await selectOption(screen.getByLabelText("Form"), "Article form");
        fireEvent.click(screen.getByText("Save page"));
        expect(await screen.findByText("Failed to create the page, try again later")).toBeInTheDocument();

        pageAPI.update.mockRejectedValueOnce(new Error("rejected"));
        renderAt(<PageEditor/>, {route: "/pages/9/edit", path});
        await screen.findByTestId("rich-text-editor");
        fireEvent.click(screen.getByText("Save page"));
        expect(await screen.findByText("Failed to update the page, try again later")).toBeInTheDocument();

        pageAPI.findById.mockRejectedValueOnce(new Error("down"));
        renderAt(<PageEditor/>, {route: "/pages/9/edit", path});
        expect(await screen.findByText("Failed to fetch the page, try again later")).toBeInTheDocument();

        formAPI.findPageable.mockRejectedValueOnce(new Error("down"));
        renderAt(<PageEditor/>, {route: "/pages/9/edit", path});
        expect(await screen.findByText("Failed to fetch the form list, try again later")).toBeInTheDocument();

        renderAt(<PageEditor/>, {route: "/pages/-1/edit", path});
        expect(screen.getByText("Called with invalid parameter")).toBeInTheDocument();
    });
});
