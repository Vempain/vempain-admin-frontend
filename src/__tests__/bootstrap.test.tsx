/**
 * Barrels, i18n resources, web vitals reporting and the application entry point.
 */
import i18n from "../i18n";
import reportWebVitals from "../reportWebVitals";

jest.mock("../services", () => ({
    aclAPI: {}, apiTokenAPI: {}, authHeader: () => ({}), componentAPI: {}, dataAPI: {}, formAPI: {}, layoutAPI: {}, pageAPI: {},
    scheduleAPI: {}, unitAPI: {}, userAPI: {}, webSiteManagementAPI: {}, taskAPI: {}, fileImportAPI: {}, fileSystemAPI: {},
    galleryAPI: {}, siteFileAPI: {}
}));

const onCLS = jest.fn();
const onINP = jest.fn();
const onFCP = jest.fn();
const onLCP = jest.fn();
const onTTFB = jest.fn();
jest.mock("web-vitals", () => ({onCLS, onINP, onFCP, onLCP, onTTFB}));

describe("barrels", () => {
    it("re-export every module of their folder", () => {
        const barrels: Record<string, Record<string, unknown>> = {
            administration: jest.requireActual("../administration"),
            content: jest.requireActual("../content"),
            file: jest.requireActual("../file"),
            main: jest.requireActual("../main"),
            models: jest.requireActual("../models"),
            schedule: jest.requireActual("../schedule"),
            tools: jest.requireActual("../tools"),
            user: jest.requireActual("../user"),
            website: jest.requireActual("../website")
        };
        for (const [name, barrel] of Object.entries(barrels)) {
            const exported = Object.keys(barrel).filter(key => key !== "__esModule");
            expect(exported.length).toBeGreaterThan(0);
            for (const key of exported) {
                expect([name, key, barrel[key]]).not.toEqual([name, key, undefined]);
            }
        }
        expect(Object.keys(barrels.content)).toEqual(expect.arrayContaining(["PageEditor", "PagePublish", "PublishSchedule", "AclEdit"]));
        expect(Object.keys(barrels.models)).toEqual(expect.arrayContaining(["FileTypeEnum", "ContentTypeEnum", "ApiTokenNetworkSource"]));
        expect(Object.keys(barrels.tools)).toEqual(expect.arrayContaining(["sanitizeRichText", "galleryIdsFromEmbeds", "isValidNetwork"]));
    });

    it("re-exports the service singletons", () => {
        jest.isolateModules(() => {
            jest.unmock("../services");
            const services = jest.requireActual("../services") as Record<string, unknown>;
            const files = jest.requireActual("../services/Files") as Record<string, unknown>;
            for (const key of Object.keys(services).filter(k => k !== "__esModule")) {
                expect(services[key]).toBeDefined();
            }
            expect(Object.keys(files).sort()).toEqual(["fileImportAPI", "fileSystemAPI", "galleryAPI", "siteFileAPI"]);
            expect(services.pageAPI).toBe((jest.requireActual("../services/PageAPI") as Record<string, unknown>).pageAPI);
        });
    });
});

describe("i18n", () => {
    it("provides the task tray and table texts in English", () => {
        expect(i18n.t("TaskProgress.title")).toBe("Background tasks");
        expect(i18n.t("TaskProgress.steps", {completed: 2, total: 5})).toBe("2 / 5 steps");
        expect(i18n.t("common.table.pagination.total", {from: 1, to: 10, total: 12})).toBe("1-10 of 12");
        expect(i18n.language).toBe("en");
    });
});

describe("reportWebVitals", () => {
    it("registers the callback with every web vital once given", async () => {
        const onPerfEntry = jest.fn();
        reportWebVitals(onPerfEntry);
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(onCLS).toHaveBeenCalledWith(onPerfEntry);
        expect(onINP).toHaveBeenCalledWith(onPerfEntry);
        expect(onFCP).toHaveBeenCalledWith(onPerfEntry);
        expect(onLCP).toHaveBeenCalledWith(onPerfEntry);
        expect(onTTFB).toHaveBeenCalledWith(onPerfEntry);
    });

    it("does nothing without a callback", async () => {
        jest.clearAllMocks();
        reportWebVitals();
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(onCLS).not.toHaveBeenCalled();
    });
});

describe("index", () => {
    it("mounts the application into #root with the session provider and reports web vitals", () => {
        const renderRoot = jest.fn();
        const createRoot = jest.fn(() => ({render: renderRoot}));
        jest.doMock("react-dom/client", () => ({__esModule: true, default: {createRoot}, createRoot}));
        jest.doMock("../App", () => ({__esModule: true, default: () => null}));
        const sessionProvider = jest.fn(({children}: { children: unknown }) => children);
        jest.doMock("@vempain/vempain-auth-frontend", () => ({SessionProvider: sessionProvider}));
        const root = document.createElement("div");
        root.id = "root";
        document.body.appendChild(root);

        jest.isolateModules(() => {
            jest.requireActual("../index");
        });

        expect(createRoot).toHaveBeenCalledWith(root);
        expect(renderRoot).toHaveBeenCalledTimes(1);
        const tree = JSON.stringify(renderRoot.mock.calls[0][0], (key, value) => key === "_owner" ? undefined : value);
        expect(tree).toContain("http://localhost:8080/api");
        expect(tree).toContain("/login");
        root.remove();
    });
});
