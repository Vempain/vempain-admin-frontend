import {fireEvent, render, type RenderResult, waitFor, within} from "@testing-library/react";
import type {ReactElement} from "react";
import {MemoryRouter, Route, Routes} from "react-router-dom";

interface RouteOptions {
    /** The URL the screen is opened at, e.g. `/pages/9/edit` */
    route: string;
    /** The route pattern that renders the screen, e.g. `/pages/:paramId/edit`; defaults to the route itself */
    path?: string;
    /** Extra routes to observe navigation, as `{path: element}` */
    extraRoutes?: Record<string, ReactElement>;
}

/** Renders a routed screen inside a MemoryRouter so that `useParams`/`useNavigate` work */
export function renderAt(ui: ReactElement, {route, path, extraRoutes = {}}: RouteOptions): RenderResult {
    return render(
            <MemoryRouter initialEntries={[route]}>
                <Routes>
                    <Route path={path ?? route} element={ui}/>
                    {Object.entries(extraRoutes).map(([extraPath, element]) => <Route key={extraPath} path={extraPath} element={element}/>)}
                </Routes>
            </MemoryRouter>
    );
}

/** Makes every antd responsive breakpoint query match (wide screen) or not (narrow screen) */
export function setScreenWidthMatches(matches: boolean): void {
    Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: jest.fn().mockImplementation((query: string) => ({
            matches,
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        })),
    });
}

/** The `.then()` chains of the screens settle after a few micro tasks */
export async function flushPromises(): Promise<void> {
    for (let i = 0; i < 5; i++) {
        await Promise.resolve();
    }
}

/** The Vite environment the screens read (`import.meta.env` is rewritten to `process.env` in tests) */
export const testEnv = (globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env;

/** Opens an antd Select and picks the option with the given title from the dropdown that is open */
export async function selectOption(combobox: HTMLElement, title: string): Promise<void> {
    fireEvent.mouseDown(combobox);
    // A previously opened dropdown is hidden once its close animation has ended; wait until only the new one is open
    const dropdown = await waitFor(() => {
        const open = document.querySelectorAll(".ant-select-dropdown:not(.ant-select-dropdown-hidden)");
        expect(open).toHaveLength(1);
        return open[0] as HTMLElement;
    });
    fireEvent.click(await within(dropdown).findByTitle(title));
}

/** Waits until the antd modal holding the given title is hidden */
export async function waitForModalClosed(title: string): Promise<void> {
    await waitFor(() => {
        const wrap = document.querySelector(".ant-modal-wrap") && (Array.from(document.querySelectorAll(".ant-modal-wrap")) as HTMLElement[])
                .find(element => element.textContent?.includes(title));
        expect(wrap === undefined || wrap === null || wrap.style.display === "none").toBe(true);
    });
}
