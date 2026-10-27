import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import {ComponentList} from "../../content/ComponentList";
import {FormList} from "../../content/FormList";
import {LayoutList} from "../../content/LayoutList";
import {acl, componentVO, formVO, layoutVO, pagedResponse, SESSION_USER_ID} from "../helpers/testData";

const useSession = jest.fn();
const componentFindPageable = jest.fn();
const formFindPageable = jest.fn();
const layoutFindPageable = jest.fn();
const findById = jest.fn();

jest.mock("@vempain/vempain-auth-frontend", () => ({
    ...jest.requireActual("@vempain/vempain-auth-frontend"),
    useSession: () => useSession()
}));

jest.mock("../../services", () => ({
    userAPI: {findById: (...args: unknown[]) => findById(...args)},
    componentAPI: {findPageable: (...args: unknown[]) => componentFindPageable(...args)},
    formAPI: {findPageable: (...args: unknown[]) => formFindPageable(...args)},
    layoutAPI: {findPageable: (...args: unknown[]) => layoutFindPageable(...args)}
}));

const foreignAcl = acl({user: 99, delete_privilege: false});

function row(text: string): HTMLElement {
    return screen.getByText(text).closest("tr") as HTMLElement;
}

describe("content lists", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useSession.mockReturnValue({userSession: {id: SESSION_USER_ID, units: []}});
        findById.mockResolvedValue({id: 1, name: "Admin", nick: "admin"});
    });

    it("lists components with edit links and delete links only where the user may delete", async () => {
        componentFindPageable.mockResolvedValue(pagedResponse([
            componentVO(),
            componentVO({id: 4, comp_name: "Footer component", acls: [foreignAcl], modified: null})
        ]));
        render(<MemoryRouter><ComponentList/></MemoryRouter>);

        expect(await screen.findByText("Header component")).toBeInTheDocument();
        expect(componentFindPageable).toHaveBeenCalledWith(expect.objectContaining({page: 0, size: 10, sort_by: "id", direction: "ASC"}));
        await waitFor(() => expect(within(row("Header component")).getAllByText("Admin (admin)").length).toBe(2));
        expect(within(row("Footer component")).getByText("-")).toBeInTheDocument();
        const headerButtons = within(row("Header component")).getAllByRole("link");
        expect(headerButtons.map(link => link.getAttribute("href"))).toEqual(["/components/3/edit", "/components/3/delete"]);
        expect(within(row("Footer component")).getAllByRole("link").map(link => link.getAttribute("href"))).toEqual(["/components/4/edit"]);
        expect(screen.getByRole("link", {name: "plus-circle"})).toHaveAttribute("href", "/components/0/edit");
        // The header stays visible below the 60px top bar while a long list is scrolled
        expect(document.querySelector(".ant-table-sticky-holder")).toHaveStyle({top: "60px"});

        // The sticky header repeats the titles in a hidden measure row, so the sort click targets the header cell
        fireEvent.click(screen.getByRole("columnheader", {name: /Component Name/}));
        await waitFor(() => expect(componentFindPageable).toHaveBeenLastCalledWith(expect.objectContaining({sort_by: "comp_name"})));
        fireEvent.click(screen.getByRole("switch"));
        await waitFor(() => expect(componentFindPageable).toHaveBeenCalledTimes(3));
    });

    it("lists forms with their components", async () => {
        formFindPageable.mockResolvedValue(pagedResponse([
            formVO({components: [componentVO(), componentVO({id: 6, comp_name: "Footer component"})]}),
            formVO({id: 8, name: "Plain form", components: [], acls: [foreignAcl], modified: null})
        ]));
        render(<MemoryRouter><FormList/></MemoryRouter>);

        expect(await screen.findByText("Article form")).toBeInTheDocument();
        expect(within(row("Article form")).getByText(/0: Header component/)).toBeInTheDocument();
        expect(within(row("Article form")).getByText(/1: Footer component/)).toBeInTheDocument();
        expect(within(row("Article form")).getAllByRole("link").map(link => link.getAttribute("href"))).toEqual(["/forms/5/edit", "/forms/5/delete"]);
        expect(within(row("Plain form")).getAllByRole("link").map(link => link.getAttribute("href"))).toEqual(["/forms/8/edit"]);
        expect(within(row("Plain form")).getByText("-")).toBeInTheDocument();
        expect(screen.getByRole("link", {name: "plus-circle"})).toHaveAttribute("href", "/forms/0/edit");

        fireEvent.click(screen.getByRole("switch"));
        await waitFor(() => expect(formFindPageable).toHaveBeenCalledTimes(2));
    });

    it("lists layouts sorted by id descending", async () => {
        layoutFindPageable.mockResolvedValue(pagedResponse([
            layoutVO({modifier: 1, modified: layoutVO().created}),
            layoutVO({id: 2, layout_name: "Old layout", acls: [foreignAcl]})
        ]));
        render(<MemoryRouter><LayoutList/></MemoryRouter>);

        expect(await screen.findByText("Main layout")).toBeInTheDocument();
        expect(layoutFindPageable).toHaveBeenCalledWith(expect.objectContaining({sort_by: "id", direction: "DESC"}));
        expect(within(row("Main layout")).getAllByRole("link").map(link => link.getAttribute("href"))).toEqual(["/layouts/4/edit", "/layouts/4/delete"]);
        expect(within(row("Old layout")).getAllByRole("link").map(link => link.getAttribute("href"))).toEqual(["/layouts/2/edit"]);
        expect(within(row("Old layout")).getByText("-")).toBeInTheDocument();
        expect(screen.getByRole("link", {name: "plus-circle"})).toHaveAttribute("href", "/layouts/0/edit");

        fireEvent.click(screen.getByRole("switch"));
        await waitFor(() => expect(layoutFindPageable).toHaveBeenCalledTimes(2));
    });

    it("renders no table while the lists are empty", async () => {
        componentFindPageable.mockResolvedValue(pagedResponse([]));
        render(<MemoryRouter><ComponentList/></MemoryRouter>);
        await waitFor(() => expect(componentFindPageable).toHaveBeenCalled());
        await waitFor(() => expect(document.querySelector(".ant-spin-spinning")).toBeNull());
        expect(document.querySelector("table")).toBeNull();
    });
});
