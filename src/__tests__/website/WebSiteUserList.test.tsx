import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {message} from "antd";
import {WebSiteUserList} from "../../website/WebSiteUserList";
import {WebSiteResourceTypeEnum} from "../../models";
import {pagedResponse, webSiteResource, webSiteUser} from "../helpers/testData";
import {selectOption, waitForModalClosed} from "../helpers/renderUtils";

const getAllWebUsers = jest.fn();
const createWebUser = jest.fn();
const updateWebUser = jest.fn();
const deleteWebUser = jest.fn();
const getAllWebAcls = jest.fn();
const getResourcesByWebUserId = jest.fn();
const createWebAcl = jest.fn();
const deleteWebAcl = jest.fn();
const getResources = jest.fn();
const findById = jest.fn();

jest.mock("../../services", () => ({
    userAPI: {findById: (...args: unknown[]) => findById(...args)},
    webSiteManagementAPI: {
        getAllWebUsers: (...args: unknown[]) => getAllWebUsers(...args),
        createWebUser: (...args: unknown[]) => createWebUser(...args),
        updateWebUser: (...args: unknown[]) => updateWebUser(...args),
        deleteWebUser: (...args: unknown[]) => deleteWebUser(...args),
        getAllWebAcls: (...args: unknown[]) => getAllWebAcls(...args),
        getResourcesByWebUserId: (...args: unknown[]) => getResourcesByWebUserId(...args),
        createWebAcl: (...args: unknown[]) => createWebAcl(...args),
        deleteWebAcl: (...args: unknown[]) => deleteWebAcl(...args),
        getResources: (...args: unknown[]) => getResources(...args)
    }
}));

const pageResource = webSiteResource();
const galleryResource = webSiteResource({resource_type: WebSiteResourceTypeEnum.GALLERY, resource_id: 12, name: "Summer", path: undefined, acl_id: 200});
const fileResource = webSiteResource({
    resource_type: WebSiteResourceTypeEnum.SITE_FILE,
    resource_id: 21,
    name: "sunset.jpg",
    path: "/2026",
    acl_id: 300,
    file_type: "IMAGE"
});

function userRow(username: string): HTMLElement {
    return screen.getByText(username).closest("tr") as HTMLElement;
}

function modal(): HTMLElement {
    return document.querySelector(".ant-modal-container") as HTMLElement;
}

async function transferOption(text: string): Promise<HTMLElement> {
    const items = await screen.findAllByText(text, {selector: ".virtual-transfer-item span"});
    return items[0].closest("[role=option]") as HTMLElement;
}

function transferButtons(): HTMLElement[] {
    return Array.from(document.querySelectorAll(".ant-transfer-actions button"));
}

describe("WebSiteUserList", () => {
    // The transfer lists with their virtual rows make these screens slow in jsdom
    jest.setTimeout(30000);

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => undefined);
        jest.spyOn(message, "success").mockImplementation(() => ({}) as never);
        jest.spyOn(message, "error").mockImplementation(() => ({}) as never);
        jest.spyOn(message, "warning").mockImplementation(() => ({}) as never);
        findById.mockResolvedValue({id: 1, name: "Admin", nick: "admin"});
        getAllWebUsers.mockResolvedValue([
            webSiteUser(),
            webSiteUser({id: 52, username: "editor", modifier: 1, modified: "2026-01-03T11:30:00Z", global_permission: true})
        ]);
        getResources.mockResolvedValue(pagedResponse([pageResource, galleryResource, fileResource]));
        getResourcesByWebUserId.mockResolvedValue({...webSiteUser(), resources: [pageResource]});
        getAllWebAcls.mockResolvedValue([{id: 900, acl_id: 100, user_id: 51, creator: 1, created: "2026"}]);
        createWebUser.mockImplementation(async (request: { username: string }) => webSiteUser({id: 53, username: request.username}));
        updateWebUser.mockResolvedValue(webSiteUser());
        createWebAcl.mockResolvedValue({});
        deleteWebAcl.mockResolvedValue(undefined);
        deleteWebUser.mockResolvedValue(undefined);
    });

    afterEach(() => jest.restoreAllMocks());

    it("lists the web users with their audit trail and global flag", async () => {
        render(<WebSiteUserList/>);
        expect(await screen.findByText("reader")).toBeInTheDocument();
        await waitFor(() => expect(within(userRow("reader")).getAllByText("Admin (admin)").length).toBeGreaterThan(0));
        expect(within(userRow("reader")).getByText("-")).toBeInTheDocument();
        expect(within(userRow("editor")).queryByText("-")).toBeNull();
        expect(within(userRow("reader")).getByText("51")).toBeInTheDocument();
        expect(userRow("editor").querySelector(".anticon-global")).not.toBeNull();
        expect(userRow("reader").querySelector(".anticon-global")).toBeNull();
    });

    it("creates a web user with the resources moved to the assigned list", async () => {
        render(<WebSiteUserList/>);
        await screen.findByText("reader");
        fireEvent.click(screen.getByRole("button", {name: "plus"}));

        expect(await screen.findByText("Create Web User")).toBeInTheDocument();
        await waitFor(() => expect(getResources).toHaveBeenCalledWith({page: 0, size: 100}));
        expect(await screen.findByText("Showing 3 of 3 resources")).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText("Username"), {target: {value: "newbie"}});
        fireEvent.change(screen.getByLabelText("Password"), {target: {value: "secret"}});
        fireEvent.click(screen.getByRole("switch"));

        fireEvent.click(await transferOption("GALLERY · Summer"));
        fireEvent.click(transferButtons()[0]);
        expect(await screen.findByText("1 resource selected")).toBeInTheDocument();

        fireEvent.click(within(modal()).getByRole("button", {name: "OK"}));
        await waitFor(() => expect(createWebUser).toHaveBeenCalledWith(expect.objectContaining({
            username: "newbie",
            password: "secret",
            global_permission: true
        })));
        await waitFor(() => expect(createWebAcl).toHaveBeenCalledWith({acl_id: 200, user_id: 53}));
        expect(message.success).toHaveBeenCalledWith("Web user created");
        expect(getAllWebUsers).toHaveBeenCalledTimes(2);
    });

    it("edits a web user, removes an assignment and warns when no resources remain", async () => {
        render(<WebSiteUserList/>);
        await screen.findByText("reader");
        fireEvent.click(within(userRow("reader")).getAllByRole("button")[0]);

        expect(await screen.findByText("Edit reader")).toBeInTheDocument();
        await waitFor(() => expect(getResourcesByWebUserId).toHaveBeenCalledWith(51));
        expect(await screen.findByText("1 resource selected")).toBeInTheDocument();

        fireEvent.click(await transferOption("PAGE · First page · /news/first"));
        fireEvent.click(transferButtons()[1]);
        expect(await screen.findByText("0 resources selected")).toBeInTheDocument();
        expect(message.warning).toHaveBeenCalledWith("No resources selected for this web user");

        fireEvent.change(screen.getByLabelText("Password"), {target: {value: ""}});
        fireEvent.click(within(modal()).getByRole("button", {name: "OK"}));
        await waitFor(() => expect(updateWebUser).toHaveBeenCalledWith(51, expect.objectContaining({username: "reader"})));
        await waitFor(() => expect(deleteWebAcl).toHaveBeenCalledWith(900));
        expect(getAllWebAcls).toHaveBeenCalledTimes(1);
        expect(message.warning).toHaveBeenCalledWith("Web user was saved without any resource access");
        expect(message.success).toHaveBeenCalledWith("Web user updated");
    });

    it("filters the resources by type, site file type and search text and loads more pages", async () => {
        getResources.mockResolvedValue(pagedResponse([pageResource], {total_pages: 2, total_elements: 2, last: false}));
        render(<WebSiteUserList/>);
        await screen.findByText("reader");
        fireEvent.click(screen.getByRole("button", {name: "plus"}));
        await screen.findByText("Create Web User");

        await selectOption(within(modal()).getAllByRole("combobox")[0], "SITE FILE");
        await selectOption(within(modal()).getAllByRole("combobox")[1], "AUDIO");

        const search = screen.getByPlaceholderText("Search resources");
        fireEvent.change(search, {target: {value: " sun "}});
        fireEvent.keyDown(search, {key: "Enter", code: "Enter"});
        await waitFor(() => expect(getResources).toHaveBeenLastCalledWith({page: 0, size: 100, type: "SITE_FILE", file_type: "AUDIO", search: "sun"}));

        fireEvent.click(screen.getByRole("button", {name: /Search/}));
        await waitFor(() => expect(getResources).toHaveBeenCalledTimes(3));

        getResources.mockResolvedValueOnce(pagedResponse([galleryResource], {page: 1, total_pages: 2, total_elements: 2, last: true}));
        const loadMore = (await screen.findByText(/Load more resources/)).closest("button") as HTMLButtonElement;
        await waitFor(() => expect(loadMore).not.toHaveClass("ant-btn-loading"));
        fireEvent.click(loadMore);
        await waitFor(() => expect(getResources).toHaveBeenLastCalledWith(expect.objectContaining({page: 1})));
        expect(await screen.findByText("Showing 2 of 2 resources")).toBeInTheDocument();
        expect(screen.queryByText(/Load more resources/)).toBeNull();

        fireEvent.click(within(modal()).getByRole("button", {name: "Cancel"}));
        await waitForModalClosed("Create Web User");
    });

    it("deletes a web user after confirmation and reports a failed deletion", async () => {
        render(<WebSiteUserList/>);
        await screen.findByText("reader");
        fireEvent.click(within(userRow("reader")).getAllByRole("button")[1]);
        expect((await screen.findAllByText("Delete reader?")).length).toBeGreaterThan(0);
        fireEvent.click(screen.getByRole("button", {name: "Delete"}));
        await waitFor(() => expect(deleteWebUser).toHaveBeenCalledWith(51));
        expect(message.success).toHaveBeenCalledWith("Web user deleted");

        deleteWebUser.mockRejectedValueOnce(new Error("rejected"));
        fireEvent.click(within(userRow("editor")).getAllByRole("button")[1]);
        expect((await screen.findAllByText("Delete editor?")).length).toBeGreaterThan(0);
        fireEvent.click(screen.getByRole("button", {name: "Delete"}));
        await waitFor(() => expect(message.error).toHaveBeenCalledWith("Failed to delete web user"));
    });

    it("reports load failures of users, resources and user resources", async () => {
        getAllWebUsers.mockRejectedValueOnce(new Error("down"));
        render(<WebSiteUserList/>);
        await waitFor(() => expect(message.error).toHaveBeenCalledWith("Failed to load web users"));

        getResources.mockRejectedValue(new Error("down"));
        getResourcesByWebUserId.mockRejectedValue(new Error("down"));
        render(<WebSiteUserList/>);
        fireEvent.click(within(await screen.findByText("reader").then(cell => cell.closest("tr") as HTMLElement)).getAllByRole("button")[0]);
        await waitFor(() => expect(message.error).toHaveBeenCalledWith("Failed to load resources"));
        await waitFor(() => expect(message.error).toHaveBeenCalledWith("Failed to load user resources"));
    });

    it("rejects an incomplete form and reports failed assignment changes", async () => {
        createWebAcl.mockRejectedValue(new Error("acl"));
        getAllWebAcls.mockRejectedValue(new Error("acls"));
        getResourcesByWebUserId.mockResolvedValue({...webSiteUser(), resources: [pageResource, galleryResource]});
        render(<WebSiteUserList/>);
        await screen.findByText("reader");

        fireEvent.click(screen.getByRole("button", {name: "plus"}));
        await screen.findByText("Create Web User");
        fireEvent.click(within(modal()).getByRole("button", {name: "OK"}));
        await waitFor(() => expect(message.error).toHaveBeenCalledWith("Operation failed"));
        expect(createWebUser).not.toHaveBeenCalled();
        fireEvent.click(within(modal()).getByRole("button", {name: "Cancel"}));
        await waitForModalClosed("Create Web User");

        fireEvent.click(within(userRow("reader")).getAllByRole("button")[0]);
        await screen.findByText("Edit reader");
        expect(await screen.findByText("2 resources selected")).toBeInTheDocument();
        fireEvent.click(await transferOption("GALLERY · Summer"));
        fireEvent.click(transferButtons()[1]);
        await screen.findByText("1 resource selected");
        fireEvent.click(await transferOption("SITE_FILE · sunset.jpg · /2026 · IMAGE"));
        fireEvent.click(transferButtons()[0]);
        await screen.findByText("2 resources selected");

        fireEvent.click(within(modal()).getByRole("button", {name: "OK"}));
        await waitFor(() => expect(message.error).toHaveBeenCalledWith("Failed to add new resource assignments"));
        await waitFor(() => expect(message.error).toHaveBeenCalledWith("Failed to remove resource assignments"));
        expect(message.success).toHaveBeenCalledWith("Web user updated");
    });

    it("refuses to save a user whose identifier is unknown", async () => {
        getAllWebUsers.mockResolvedValue([{...webSiteUser(), id: undefined as unknown as number}]);
        createWebUser.mockResolvedValue({...webSiteUser(), id: undefined as unknown as number});
        render(<WebSiteUserList/>);
        await screen.findByText("reader");
        expect(within(userRow("reader")).getByText("-", {selector: "td:first-child"})).toBeInTheDocument();

        fireEvent.click(within(userRow("reader")).getAllByRole("button")[0]);
        await screen.findByText("Edit reader");
        expect(getResourcesByWebUserId).not.toHaveBeenCalled();
        fireEvent.click(within(modal()).getByRole("button", {name: "OK"}));
        await waitFor(() => expect(message.error).toHaveBeenCalledWith("Missing user identifier"));
        fireEvent.click(within(modal()).getByRole("button", {name: "Cancel"}));
        await waitForModalClosed("Edit reader");

        fireEvent.click(within(userRow("reader")).getAllByRole("button")[1]);
        await waitFor(() => expect(message.error).toHaveBeenCalledWith("Missing user identifier"));
        expect(screen.queryAllByText("Delete reader?")).toHaveLength(0);

        fireEvent.click(screen.getByRole("button", {name: "plus"}));
        await screen.findByText("Create Web User");
        fireEvent.change(screen.getByLabelText("Username"), {target: {value: "ghost"}});
        fireEvent.change(screen.getByLabelText("Password"), {target: {value: "pw"}});
        fireEvent.click(within(modal()).getByRole("button", {name: "OK"}));
        await waitFor(() => expect(message.error).toHaveBeenCalledWith("Failed to determine user identifier"));
    });
});
