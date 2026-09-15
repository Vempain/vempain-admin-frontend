import {render, screen} from "@testing-library/react";
import {MemoryRouter, Route, Routes} from "react-router-dom";
import {useSession} from "@vempain/vempain-auth-frontend";
import {ProtectedRoute} from "../main/ProtectedRoute";

jest.mock("@vempain/vempain-auth-frontend", () => ({
    useSession: jest.fn(),
}), {virtual: true});

const mockedUseSession = useSession as jest.MockedFunction<typeof useSession>;

describe("ProtectedRoute", () => {
    it("redirects anonymous users to login without rendering admin content", () => {
        mockedUseSession.mockReturnValue({userSession: null} as ReturnType<typeof useSession>);

        render(
                <MemoryRouter initialEntries={["/pages/42/edit"]}>
                    <Routes>
                        <Route element={<ProtectedRoute/>}>
                            <Route path="/pages/:id/edit" element={<div>admin editor</div>}/>
                        </Route>
                        <Route path="/login" element={<div>login</div>}/>
                    </Routes>
                </MemoryRouter>,
        );

        expect(screen.getByText("login")).toBeInTheDocument();
        expect(screen.queryByText("admin editor")).not.toBeInTheDocument();
    });

    it("renders an admin route for an authenticated session", () => {
        mockedUseSession.mockReturnValue({userSession: {id: 7}} as ReturnType<typeof useSession>);

        render(
                <MemoryRouter initialEntries={["/pages/42/edit"]}>
                    <Routes>
                        <Route element={<ProtectedRoute/>}>
                            <Route path="/pages/:id/edit" element={<div>admin editor</div>}/>
                        </Route>
                    </Routes>
                </MemoryRouter>,
        );

        expect(screen.getByText("admin editor")).toBeInTheDocument();
    });
});
