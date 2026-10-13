import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import {useSession} from "@vempain/vempain-auth-frontend";
import {TopBar} from "../../main/TopBar";
import {setScreenWidthMatches} from "../helpers/renderUtils";

jest.mock("@vempain/vempain-auth-frontend", () => ({
    useSession: jest.fn(),
}), {virtual: true});

const mockedUseSession = useSession as jest.MockedFunction<typeof useSession>;

function renderTopBar() {
    return render(<MemoryRouter><TopBar/></MemoryRouter>);
}

describe("TopBar", () => {
    beforeEach(() => {
        mockedUseSession.mockReturnValue({userSession: {id: 7, nickname: "admin"}} as unknown as ReturnType<typeof useSession>);
    });

    it("shows the management menus and the profile of the signed-in user on a wide screen", async () => {
        setScreenWidthMatches(true);
        renderTopBar();

        await waitFor(() => expect(screen.getByText("Content Management")).toBeInTheDocument());
        expect(screen.getByText("File Management")).toBeInTheDocument();
        expect(screen.getByText("Schedule Management")).toBeInTheDocument();
        expect(screen.getByText("Web Site Management")).toBeInTheDocument();
        expect(screen.getByText("User Management")).toBeInTheDocument();
        expect(screen.getByText("Profile (admin)")).toBeInTheDocument();
        expect(screen.queryByLabelText("Open menu")).not.toBeInTheDocument();
        expect(screen.getByAltText("Home").closest("a")).toHaveAttribute("href", "/");
    });

    it("offers only the login entry without a session", async () => {
        setScreenWidthMatches(true);
        mockedUseSession.mockReturnValue({userSession: null} as unknown as ReturnType<typeof useSession>);
        renderTopBar();

        await waitFor(() => expect(screen.getByText("Login")).toBeInTheDocument());
        expect(screen.getByText("Login").closest("a")).toHaveAttribute("href", "/login");
        expect(screen.queryByText("Content Management")).not.toBeInTheDocument();
    });

    it("opens the drawer menu on a narrow screen, selects a link and closes the drawer", async () => {
        setScreenWidthMatches(false);
        renderTopBar();

        const openButton = await screen.findByLabelText("Open menu");
        fireEvent.click(openButton);

        const contentGroup = await screen.findByText("Content Management");
        fireEvent.click(contentGroup);
        const layoutLink = await screen.findByText("Layout");
        expect(layoutLink.closest("a")).toHaveAttribute("href", "/layouts");
        fireEvent.click(layoutLink);
        await waitFor(() => expect(layoutLink.closest("li")).toHaveClass("ant-menu-item-selected"));

        fireEvent.click(screen.getByLabelText("Close"));
        await waitFor(() => expect(document.querySelector(".ant-drawer-open")).toBeNull());
    });
});
