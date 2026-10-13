import {render, screen, waitFor} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import App from "../App";
import {pagedResponse} from "./helpers/testData";
import {setScreenWidthMatches} from "./helpers/renderUtils";

const useSession = jest.fn();

jest.mock("@vempain/vempain-auth-frontend", () => ({
    ...jest.requireActual("@vempain/vempain-auth-frontend"),
    useSession: () => useSession(),
    Login: () => <div>login screen</div>,
    Logout: () => <div>logout screen</div>
}));

jest.mock("../services", () => {
    const paged = jest.fn(async () => ({content: [], page: 0, size: 0, total_elements: 0, total_pages: 0, first: true, last: true, empty: true}));
    const resolveEmpty = jest.fn(async () => []);
    return {
        taskAPI: {getTasks: jest.fn(async () => [])},
        userAPI: {findById: jest.fn(async () => ({id: 1, name: "Admin", nick: "admin"}))},
        unitAPI: {},
        componentAPI: {findPageable: paged},
        formAPI: {findPageable: paged},
        layoutAPI: {findPageable: paged},
        pageAPI: {findPageable: paged},
        galleryAPI: {findPageableList: paged},
        siteFileAPI: {getPagedSiteFiles: paged},
        fileSystemAPI: {},
        dataAPI: {getAllDataSets: resolveEmpty},
        scheduleAPI: {getSystemSchedules: resolveEmpty, getPublishSchedules: resolveEmpty},
        webSiteManagementAPI: {getAllWebUsers: resolveEmpty, getAllConfigurations: resolveEmpty},
        apiTokenAPI: {list: resolveEmpty, defaultNetwork: jest.fn(async () => ({network: null, source: "NONE", candidates: []}))},
        aclAPI: {},
        authHeader: () => ({})
    };
});

function renderApp(route: string) {
    return render(<MemoryRouter initialEntries={[route]}><App/></MemoryRouter>);
}

describe("App", () => {
    beforeEach(() => {
        setScreenWidthMatches(true);
        useSession.mockReturnValue({userSession: {id: 7, nickname: "admin", units: []}});
    });

    it("renders the home screen with the top bar, footer and task tray for a signed-in user", async () => {
        renderApp("/");
        expect(screen.getByRole("heading", {name: "Home"})).toBeInTheDocument();
        expect(await screen.findByText("Content Management")).toBeInTheDocument();
        expect(document.querySelector("footer")).not.toBeNull();
    });

    it("routes to the login and logout screens and redirects unknown paths home", async () => {
        renderApp("/login");
        expect(screen.getByText("login screen")).toBeInTheDocument();
        renderApp("/logout");
        expect(screen.getByText("logout screen")).toBeInTheDocument();
        renderApp("/does/not/exist");
        await waitFor(() => expect(screen.getByRole("heading", {name: "Home"})).toBeInTheDocument());
    });

    it("mounts the protected screens, such as the component list and the image files", async () => {
        renderApp("/components");
        expect(await screen.findByText(/Component List/)).toBeInTheDocument();
        renderApp("/images");
        expect(await screen.findByRole("heading", {name: "Image Files"})).toBeInTheDocument();
        expect(pagedResponse([]).empty).toBe(true);
    });

    it("sends anonymous users of protected screens to the login screen", () => {
        useSession.mockReturnValue({userSession: null});
        renderApp("/pages");
        expect(screen.getByText("login screen")).toBeInTheDocument();
        expect(screen.queryByText(/Page List/)).toBeNull();
    });
});
