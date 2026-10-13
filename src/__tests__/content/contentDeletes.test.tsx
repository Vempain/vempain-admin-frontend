import {fireEvent, screen, waitFor} from "@testing-library/react";
import {ComponentDelete} from "../../content/ComponentDelete";
import {FormDelete} from "../../content/FormDelete";
import {LayoutDelete} from "../../content/LayoutDelete";
import {PageDelete} from "../../content/PageDelete";
import {componentVO, formVO, layoutVO, pageResponse} from "../helpers/testData";
import {renderAt} from "../helpers/renderUtils";

const componentAPI = {findById: jest.fn(), delete: jest.fn()};
const formAPI = {findById: jest.fn(), delete: jest.fn(), findFormsByComponentId: jest.fn(), findFormsByLayoutId: jest.fn()};
const layoutAPI = {findById: jest.fn(), delete: jest.fn()};
const pageAPI = {findById: jest.fn(), delete: jest.fn(), findPagesByFormId: jest.fn()};

jest.mock("../../services", () => ({
    componentAPI: {findById: (...a: unknown[]) => componentAPI.findById(...a), delete: (...a: unknown[]) => componentAPI.delete(...a)},
    formAPI: {
        findById: (...a: unknown[]) => formAPI.findById(...a),
        delete: (...a: unknown[]) => formAPI.delete(...a),
        findFormsByComponentId: (...a: unknown[]) => formAPI.findFormsByComponentId(...a),
        findFormsByLayoutId: (...a: unknown[]) => formAPI.findFormsByLayoutId(...a)
    },
    layoutAPI: {findById: (...a: unknown[]) => layoutAPI.findById(...a), delete: (...a: unknown[]) => layoutAPI.delete(...a)},
    pageAPI: {
        findById: (...a: unknown[]) => pageAPI.findById(...a),
        delete: (...a: unknown[]) => pageAPI.delete(...a),
        findPagesByFormId: (...a: unknown[]) => pageAPI.findPagesByFormId(...a)
    }
}));

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    jest.spyOn(console, "debug").mockImplementation(() => undefined);
    componentAPI.findById.mockResolvedValue(componentVO());
    componentAPI.delete.mockResolvedValue(true);
    formAPI.findById.mockResolvedValue(formVO());
    formAPI.delete.mockResolvedValue(true);
    formAPI.findFormsByComponentId.mockResolvedValue([formVO(), formVO({id: 6, name: "Second form"})]);
    formAPI.findFormsByLayoutId.mockResolvedValue([formVO()]);
    layoutAPI.findById.mockResolvedValue(layoutVO());
    layoutAPI.delete.mockResolvedValue(true);
    pageAPI.findById.mockResolvedValue(pageResponse());
    pageAPI.delete.mockResolvedValue(true);
    pageAPI.findPagesByFormId.mockImplementation(async (formId: number) => formId === 5 ? [pageResponse()] : []);
});

afterEach(() => jest.restoreAllMocks());

describe("ComponentDelete", () => {
    const route = {route: "/components/3/delete", path: "/components/:paramId/delete"};

    it("shows the forms and pages that go with the component and deletes it", async () => {
        renderAt(<ComponentDelete/>, route);
        expect(await screen.findByText(/Deleting component Header component/)).toBeInTheDocument();
        expect(await screen.findByText("5 Article form")).toBeInTheDocument();
        expect(screen.getByText("6 Second form")).toBeInTheDocument();
        expect(screen.getByText("9 First page")).toBeInTheDocument();
        expect(pageAPI.findPagesByFormId).toHaveBeenCalledTimes(2);

        fireEvent.click(screen.getByText("Delete component"));
        await waitFor(() => expect(componentAPI.delete).toHaveBeenCalledWith(3));
        expect(await screen.findByText("Component deleted successfully")).toBeInTheDocument();
        expect(screen.getByText("Back").closest("a")).toHaveAttribute("href", "/components");
    });

    it("reports a failed deletion", async () => {
        componentAPI.delete.mockRejectedValue(new Error("locked"));
        renderAt(<ComponentDelete/>, route);
        await screen.findByText("5 Article form");
        fireEvent.click(screen.getByText("Delete component"));
        expect(await screen.findByText("Failed to delete the component, try again later")).toBeInTheDocument();
    });

    it("reports failures of each lookup", async () => {
        componentAPI.findById.mockRejectedValueOnce(new Error("down"));
        renderAt(<ComponentDelete/>, route);
        expect(await screen.findByText("Failed to fetch the component details, try again later")).toBeInTheDocument();

        formAPI.findFormsByComponentId.mockRejectedValueOnce(new Error("down"));
        renderAt(<ComponentDelete/>, route);
        expect(await screen.findByText("Failed to fetch the list of forms using the component, try again later")).toBeInTheDocument();

        pageAPI.findPagesByFormId.mockRejectedValue(new Error("down"));
        renderAt(<ComponentDelete/>, route);
        expect(await screen.findByText("Failed to fetch the list of pages using the form, try again later")).toBeInTheDocument();
    });

    it("rejects an invalid id and loads nothing for id 0", () => {
        renderAt(<ComponentDelete/>, {route: "/components/-1/delete", path: route.path});
        expect(screen.getByText("Called with invalid parameter")).toBeInTheDocument();

        renderAt(<ComponentDelete/>, {route: "/components/0/delete", path: route.path});
        expect(componentAPI.findById).not.toHaveBeenCalled();
        fireEvent.click(screen.getByText("Delete component"));
        expect(componentAPI.delete).not.toHaveBeenCalled();
    });
});

describe("FormDelete", () => {
    const route = {route: "/forms/5/delete", path: "/forms/:paramId/delete"};

    it("shows the pages using the form and deletes it", async () => {
        renderAt(<FormDelete/>, route);
        expect(await screen.findByText(/Deleting component Article form/)).toBeInTheDocument();
        expect(await screen.findByText("9 First page")).toBeInTheDocument();
        fireEvent.click(screen.getByText("Delete form"));
        await waitFor(() => expect(formAPI.delete).toHaveBeenCalledWith(5));
        expect(await screen.findByText("Form deleted successfully")).toBeInTheDocument();
        expect(screen.getByText("Back").closest("a")).toHaveAttribute("href", "/forms");
    });

    it("reports failures of the lookups and of the deletion", async () => {
        formAPI.delete.mockRejectedValueOnce(new Error("locked"));
        renderAt(<FormDelete/>, route);
        fireEvent.click(await screen.findByText("Delete form"));
        expect(await screen.findByText("Failed to delete the form, try again later")).toBeInTheDocument();

        formAPI.findById.mockRejectedValueOnce(new Error("down"));
        renderAt(<FormDelete/>, route);
        expect(await screen.findByText("Failed to fetch the form details, try again later")).toBeInTheDocument();

        pageAPI.findPagesByFormId.mockRejectedValueOnce(new Error("down"));
        renderAt(<FormDelete/>, route);
        expect(await screen.findByText("Failed to fetch the list of pages using the form, try again later")).toBeInTheDocument();
    });

    it("rejects an invalid id and loads nothing for id 0", () => {
        renderAt(<FormDelete/>, {route: "/forms/-1/delete", path: route.path});
        expect(screen.getByText("Called with invalid parameter")).toBeInTheDocument();
        renderAt(<FormDelete/>, {route: "/forms/0/delete", path: route.path});
        expect(formAPI.findById).not.toHaveBeenCalled();
        fireEvent.click(screen.getByText("Delete form"));
        expect(formAPI.delete).not.toHaveBeenCalled();
    });
});

describe("LayoutDelete", () => {
    const route = {route: "/layouts/4/delete", path: "/layouts/:paramId/delete"};

    it("shows the forms and pages depending on the layout and deletes it", async () => {
        renderAt(<LayoutDelete/>, route);
        expect(await screen.findByText(/Deleting layout Main layout/)).toBeInTheDocument();
        expect(await screen.findByText("5 Article form")).toBeInTheDocument();
        expect(screen.getByText("9 First page")).toBeInTheDocument();
        fireEvent.click(screen.getByText("Delete layout"));
        await waitFor(() => expect(layoutAPI.delete).toHaveBeenCalledWith(4));
        expect(await screen.findByText("Layout deleted successfully")).toBeInTheDocument();
    });

    it("reports failures of the lookups and of the deletion", async () => {
        layoutAPI.delete.mockRejectedValueOnce(new Error("locked"));
        renderAt(<LayoutDelete/>, route);
        await screen.findByText("5 Article form");
        fireEvent.click(screen.getByText("Delete layout"));
        expect(await screen.findByText("Failed to delete the layout, try again later")).toBeInTheDocument();

        layoutAPI.findById.mockRejectedValueOnce(new Error("down"));
        renderAt(<LayoutDelete/>, route);
        expect(await screen.findByText("Failed to fetch the layout details, try again later")).toBeInTheDocument();

        formAPI.findFormsByLayoutId.mockRejectedValueOnce(new Error("down"));
        renderAt(<LayoutDelete/>, route);
        expect(await screen.findByText("Failed to fetch the list of forms using the component, try again later")).toBeInTheDocument();

        pageAPI.findPagesByFormId.mockRejectedValue(new Error("down"));
        renderAt(<LayoutDelete/>, route);
        expect(await screen.findByText("Failed to fetch the list of pages using the form, try again later")).toBeInTheDocument();
    });

    it("rejects an invalid id and loads nothing for id 0", () => {
        renderAt(<LayoutDelete/>, {route: "/layouts/-1/delete", path: route.path});
        expect(screen.getByText("Called with invalid parameter")).toBeInTheDocument();
        renderAt(<LayoutDelete/>, {route: "/layouts/0/delete", path: route.path});
        expect(layoutAPI.findById).not.toHaveBeenCalled();
        fireEvent.click(screen.getByText("Delete layout"));
        expect(layoutAPI.delete).not.toHaveBeenCalled();
    });
});

describe("PageDelete", () => {
    const route = {route: "/pages/9/delete", path: "/pages/:paramId/delete"};

    it("deletes the page", async () => {
        renderAt(<PageDelete/>, route);
        await waitFor(() => expect(pageAPI.findById).toHaveBeenCalledWith(9, null));
        await waitFor(() => expect(document.querySelector(".ant-spin-spinning")).toBeNull());
        fireEvent.click(screen.getByText("Delete page"));
        await waitFor(() => expect(pageAPI.delete).toHaveBeenCalledWith(9));
        expect(await screen.findByText("Page deleted successfully")).toBeInTheDocument();
        expect(screen.getByText("Back").closest("a")).toHaveAttribute("href", "/pages");
    });

    it("reports a failed lookup and a failed deletion", async () => {
        pageAPI.delete.mockRejectedValueOnce(new Error("locked"));
        renderAt(<PageDelete/>, route);
        await waitFor(() => expect(document.querySelector(".ant-spin-spinning")).toBeNull());
        fireEvent.click(screen.getByText("Delete page"));
        expect(await screen.findByText("Failed to delete the page, try again later")).toBeInTheDocument();

        pageAPI.findById.mockRejectedValueOnce(new Error("down"));
        renderAt(<PageDelete/>, route);
        expect(await screen.findByText("Failed to fetch the page details, try again later")).toBeInTheDocument();
    });

    it("rejects an invalid id and loads nothing for id 0", () => {
        renderAt(<PageDelete/>, {route: "/pages/-1/delete", path: route.path});
        expect(screen.getByText("Called with invalid parameter")).toBeInTheDocument();
        renderAt(<PageDelete/>, {route: "/pages/0/delete", path: route.path});
        expect(pageAPI.findById).not.toHaveBeenCalled();
        fireEvent.click(screen.getByText("Delete page"));
        expect(pageAPI.delete).not.toHaveBeenCalled();
    });
});
