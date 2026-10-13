import type {AclVO} from "@vempain/vempain-auth-frontend";
import {QueryDetailEnum} from "../../models";

/**
 * Every service is a singleton built from VITE_APP_API_URL and its backend prefix; the requests go through the Axios instance
 * `AbstractAPI` creates, which is replaced by a recording stub here.
 */
const axiosStub = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    defaults: {headers: {put: {} as Record<string, string>, common: {} as Record<string, string>}},
    interceptors: {request: {use: jest.fn()}, response: {use: jest.fn(), eject: jest.fn()}}
};
const mockCreate = jest.fn((_config: { baseURL: string }) => axiosStub);

jest.mock("axios", () => ({
    __esModule: true,
    default: {create: (config: { baseURL: string }) => mockCreate(config)},
    create: (config: { baseURL: string }) => mockCreate(config)
}));

const {
    aclAPI,
    apiTokenAPI,
    componentAPI,
    dataAPI,
    fileImportAPI,
    fileSystemAPI,
    formAPI,
    galleryAPI,
    layoutAPI,
    pageAPI,
    scheduleAPI,
    siteFileAPI,
    taskAPI,
    unitAPI,
    userAPI,
    webSiteManagementAPI
} = jest.requireActual("../../services") as typeof import("../../services");

const BASE = "http://localhost:8080/api";

function respond(method: jest.Mock, data: unknown, status = 200) {
    method.mockResolvedValueOnce({data, status});
}

describe("service singletons", () => {
    it("are built on VITE_APP_API_URL with their backend prefix", () => {
        const baseURLs = mockCreate.mock.calls.map(call => call[0].baseURL);
        expect(baseURLs).toEqual(expect.arrayContaining([
            `${BASE}/content-management/acls`,
            `${BASE}/admin-management/api-tokens`,
            `${BASE}/content-management/components`,
            `${BASE}/content-management/data`,
            `${BASE}/content-management/forms`,
            `${BASE}/content-management/layouts`,
            `${BASE}/content-management/pages`,
            `${BASE}/schedule-management`,
            `${BASE}/content-management/units`,
            `${BASE}/content-management/users`,
            `${BASE}/admin-management/site`,
            `${BASE}/content-management/file`,
            `${BASE}/content-management/galleries`,
            `${BASE}/content-management/file/site-files`
        ]));
        expect(unitAPI).toBeDefined();
        expect(userAPI).toBeDefined();
    });

    it("creates the task progress client of the admin backend", () => {
        const client = taskAPI as unknown as { baseURL: string; member: string };
        expect(client.baseURL).toBe(BASE);
        expect(client.member).toBe("/tasks");
    });
});

describe("authorization header", () => {
    afterEach(() => localStorage.clear());

    it("is taken from the stored session before every request", async () => {
        localStorage.setItem("vempainUser", JSON.stringify({token: "jwt-token"}));
        respond(axiosStub.get, []);
        await componentAPI.findAll();
        expect(axiosStub.defaults.headers.common["Authorization"]).toBe("Bearer jwt-token");
    });
});

describe("aclAPI", () => {
    it("replaces null user and unit references with 0", async () => {
        const acls: AclVO[] = [
            {permission_id: 1, acl_id: 5, user: null, unit: 3, create_privilege: true, read_privilege: true, modify_privilege: false, delete_privilege: false},
            {permission_id: 2, acl_id: 5, user: 4, unit: null, create_privilege: false, read_privilege: true, modify_privilege: false, delete_privilege: false}
        ];
        respond(axiosStub.get, acls);
        const byId = await aclAPI.findAllById(5);
        expect(axiosStub.get).toHaveBeenLastCalledWith("/5");
        expect(byId[0].user).toBe(0);
        expect(byId[0].unit).toBe(3);
        expect(byId[1].unit).toBe(0);

        respond(axiosStub.get, [{...acls[0], user: null, unit: null}]);
        const all = await aclAPI.findAll();
        expect(axiosStub.get).toHaveBeenLastCalledWith("", {params: undefined});
        expect(all[0]).toMatchObject({user: 0, unit: 0});
    });
});

describe("apiTokenAPI", () => {
    it("lists, proposes a network, creates and deletes tokens", async () => {
        respond(axiosStub.get, [{id: 1}]);
        expect(await apiTokenAPI.list()).toEqual([{id: 1}]);

        respond(axiosStub.get, {network: "10.0.0.0/24", source: "PRIVATE_NETWORK", candidates: []});
        expect((await apiTokenAPI.defaultNetwork()).network).toBe("10.0.0.0/24");
        expect(axiosStub.get).toHaveBeenLastCalledWith("/default-network");

        const request = {description: "file backend", network: "10.0.0.0/24", expires_at: "2027-01-01T00:00:00Z"};
        respond(axiosStub.post, {token: "secret", api_token: {id: 2}});
        expect((await apiTokenAPI.createToken(request)).token).toBe("secret");
        expect(axiosStub.post).toHaveBeenLastCalledWith("", request);

        respond(axiosStub.delete, undefined);
        await apiTokenAPI.deleteToken(2);
        expect(axiosStub.delete).toHaveBeenLastCalledWith("/2");
    });
});

describe("dataAPI", () => {
    it("queries the data sets and starts the publishing task", async () => {
        respond(axiosStub.get, [{identifier: "gps"}]);
        expect(await dataAPI.getAllDataSets({type: "time_series", search: "gps"})).toEqual([{identifier: "gps"}]);
        expect(axiosStub.get).toHaveBeenLastCalledWith("", {params: {type: "time_series", search: "gps"}});

        respond(axiosStub.get, []);
        await dataAPI.getAllDataSets();
        expect(axiosStub.get).toHaveBeenLastCalledWith("", {params: {}});

        respond(axiosStub.post, {task_id: "t1"});
        expect((await dataAPI.publishDataSet("music")).task_id).toBe("t1");
        expect(axiosStub.post).toHaveBeenLastCalledWith("/music/publish");
    });
});

describe("formAPI", () => {
    it("finds the forms using a component or a layout", async () => {
        respond(axiosStub.get, [{id: 1}]);
        expect(await formAPI.findFormsByComponentId(7)).toEqual([{id: 1}]);
        expect(axiosStub.get).toHaveBeenLastCalledWith("/used-by-components/7");

        respond(axiosStub.get, [{id: 2}]);
        expect(await formAPI.findFormsByLayoutId(8)).toEqual([{id: 2}]);
        expect(axiosStub.get).toHaveBeenLastCalledWith("/used-by-layout/8");
    });
});

describe("layoutAPI and componentAPI", () => {
    it("use the generic CRUD operations of the base class", async () => {
        respond(axiosStub.get, {id: 4});
        expect(await layoutAPI.findById(4, null)).toEqual({id: 4});
        expect(axiosStub.get).toHaveBeenLastCalledWith("/4");

        respond(axiosStub.get, {id: 4});
        await layoutAPI.findById(4, "details=FULL");
        expect(axiosStub.get).toHaveBeenLastCalledWith("/4?details=FULL");

        respond(axiosStub.post, {id: 5});
        expect(await componentAPI.create({id: 0} as never)).toEqual({id: 5});
        expect(axiosStub.post).toHaveBeenLastCalledWith("", {id: 0});

        respond(axiosStub.put, {id: 5});
        expect(await componentAPI.update({id: 5} as never)).toEqual({id: 5});

        respond(axiosStub.delete, undefined, 200);
        expect(await componentAPI.delete(5)).toBe(true);

        respond(axiosStub.post, {content: [], page: 0});
        await componentAPI.findPageable({page: 0, size: 10});
        expect(axiosStub.post).toHaveBeenLastCalledWith("paged", {page: 0, size: 10});
    });
});

describe("pageAPI", () => {
    it("finds pages by form, suggests paths and publishes", async () => {
        respond(axiosStub.get, [{id: 9}]);
        expect(await pageAPI.findPagesByFormId(5)).toEqual([{id: 9}]);
        expect(axiosStub.get).toHaveBeenLastCalledWith("/by-form/5");

        respond(axiosStub.get, {suggestion: "/news"});
        expect((await pageAPI.suggestPath("/ne")).suggestion).toBe("/news");
        expect(axiosStub.get).toHaveBeenLastCalledWith("/path-suggestion", {params: {prefix: "/ne"}});

        const request = {id: 9, publish_message: "m", publish_schedule: false, publish_date_time: null};
        respond(axiosStub.patch, {result: "OK", task: {task_id: "t"}});
        expect((await pageAPI.publish(request)).task?.task_id).toBe("t");
        expect(axiosStub.patch).toHaveBeenLastCalledWith("/publish", request);

        respond(axiosStub.get, {result: "OK"});
        await pageAPI.publishAll({publish_date: "2026-01-01T00:00:00Z"});
        expect(axiosStub.get).toHaveBeenLastCalledWith("/publish", {params: {publish_date: "2026-01-01T00:00:00Z"}});
    });
});

describe("scheduleAPI", () => {
    it("reads and triggers system and publish schedules", async () => {
        respond(axiosStub.get, [{id: 1}]);
        expect(await scheduleAPI.getSystemSchedules()).toEqual([{id: 1}]);
        expect(axiosStub.get).toHaveBeenLastCalledWith("/system-schedules");
        expect(axiosStub.defaults.headers.put["Content-Type"]).toBe("application/json;charset=utf-8");

        respond(axiosStub.get, {id: 1});
        expect(await scheduleAPI.getSystemSchedule("nightly")).toEqual({id: 1});
        expect(axiosStub.get).toHaveBeenLastCalledWith("/system-schedules/nightly");

        const trigger = {schedule_name: "nightly", delay: 3};
        respond(axiosStub.post, {id: 1});
        expect(await scheduleAPI.triggerSystemSchedule(trigger)).toEqual({id: 1});
        expect(axiosStub.post).toHaveBeenLastCalledWith("/system-schedules", trigger);

        respond(axiosStub.get, [{id: 2}]);
        expect(await scheduleAPI.getPublishSchedules()).toEqual([{id: 2}]);
        expect(axiosStub.get).toHaveBeenLastCalledWith("/publishing");

        respond(axiosStub.get, {id: 2});
        expect(await scheduleAPI.getPublishSchedule(2)).toEqual({id: 2});
        expect(axiosStub.get).toHaveBeenLastCalledWith("/publishing/2");

        respond(axiosStub.post, {id: 2});
        await scheduleAPI.triggerPublishSchedule({id: 2} as never);
        expect(axiosStub.post).toHaveBeenLastCalledWith("/publishing", {id: 2});
    });
});

describe("webSiteManagementAPI", () => {
    it("manages web users, ACLs, resources and the configuration", async () => {
        respond(axiosStub.get, [{id: 1}]);
        expect(await webSiteManagementAPI.getAllWebUsers()).toEqual([{id: 1}]);
        expect(axiosStub.get).toHaveBeenLastCalledWith("/users");

        respond(axiosStub.get, {id: 1});
        expect(await webSiteManagementAPI.getWebUserById(1)).toEqual({id: 1});
        expect(axiosStub.get).toHaveBeenLastCalledWith("/users/1");

        const user = {username: "u", password: "p", global_permission: false};
        respond(axiosStub.post, {id: 2});
        expect(await webSiteManagementAPI.createWebUser(user)).toEqual({id: 2});
        expect(axiosStub.post).toHaveBeenLastCalledWith("/users", user);

        respond(axiosStub.put, {id: 2});
        expect(await webSiteManagementAPI.updateWebUser(2, user)).toEqual({id: 2});
        expect(axiosStub.put).toHaveBeenLastCalledWith("/users/2", user);

        respond(axiosStub.delete, undefined);
        await webSiteManagementAPI.deleteWebUser(2);
        expect(axiosStub.delete).toHaveBeenLastCalledWith("/users/2");

        respond(axiosStub.get, [{id: 3}]);
        expect(await webSiteManagementAPI.getAllWebAcls()).toEqual([{id: 3}]);
        expect(axiosStub.get).toHaveBeenLastCalledWith("/acls");

        respond(axiosStub.get, {acl_id: 3, users: []});
        expect(await webSiteManagementAPI.getWebUsersByWebAclId(3)).toEqual({acl_id: 3, users: []});
        expect(axiosStub.get).toHaveBeenLastCalledWith("/acls/3/users");

        respond(axiosStub.get, {id: 2, resources: []});
        expect(await webSiteManagementAPI.getResourcesByWebUserId(2)).toEqual({id: 2, resources: []});
        expect(axiosStub.get).toHaveBeenLastCalledWith("/users/2/resources");

        respond(axiosStub.post, {id: 4});
        expect(await webSiteManagementAPI.createWebAcl({acl_id: 3, user_id: 2})).toEqual({id: 4});
        expect(axiosStub.post).toHaveBeenLastCalledWith("/acls", {acl_id: 3, user_id: 2});

        respond(axiosStub.delete, undefined);
        await webSiteManagementAPI.deleteWebAcl(4);
        expect(axiosStub.delete).toHaveBeenLastCalledWith("/acls/4");

        respond(axiosStub.post, {content: [], page: 0});
        await webSiteManagementAPI.getResources({page: 0, size: 100});
        expect(axiosStub.post).toHaveBeenLastCalledWith("/resources", {page: 0, size: 100});

        respond(axiosStub.get, [{id: "k"}]);
        expect(await webSiteManagementAPI.getAllConfigurations()).toEqual([{id: "k"}]);
        expect(axiosStub.get).toHaveBeenLastCalledWith("/config");

        respond(axiosStub.get, {id: "k"});
        expect(await webSiteManagementAPI.getConfiguration(6)).toEqual({id: "k"});
        expect(axiosStub.get).toHaveBeenLastCalledWith("/config/6");

        respond(axiosStub.put, {id: "k", config_value: "v"});
        expect(await webSiteManagementAPI.updateConfiguration({id: "k", config_value: "v"})).toEqual({id: "k", config_value: "v"});
        expect(axiosStub.put).toHaveBeenLastCalledWith("/config", {id: "k", config_value: "v"});
    });
});

describe("file services", () => {
    beforeEach(() => jest.spyOn(console, "log").mockImplementation(() => undefined));
    afterEach(() => jest.restoreAllMocks());

    it("imports a directory and uploads files", async () => {
        respond(axiosStub.post, {result: "OK"});
        await fileImportAPI.importDirectory("/src", "/dst", true, "gal", "desc", true, "/path", "Title", "Body", 5, false);
        expect(axiosStub.post).toHaveBeenLastCalledWith("/add-directory", {
            source_directory: "/src",
            destination_directory: "/dst",
            generate_gallery: true,
            gallery_shortname: "gal",
            gallery_description: "desc",
            generate_page: true,
            page_path: "/path",
            page_title: "Title",
            page_body: "Body",
            page_form_id: 5,
            schedule: false
        });

        const file = new File(["x"], "x.txt", {type: "text/plain"});
        respond(axiosStub.post, {result: "OK"});
        await fileImportAPI.uploadFiles([file], "/dst", "gal", "desc");
        const [path, formData, config] = axiosStub.post.mock.calls.at(-1) as [string, FormData, { headers: Record<string, string> }];
        expect(path).toBe("/upload");
        expect(formData.get("destination_directory")).toBe("/dst");
        expect(formData.get("gallery_shortname")).toBe("gal");
        expect(formData.get("gallery_description")).toBe("desc");
        expect(formData.getAll("file_list")).toHaveLength(1);
        expect(config.headers["Content-Type"]).toBe("multipart/form-data");

        respond(axiosStub.post, {result: "OK"});
        await fileImportAPI.uploadFiles([], "/dst", "", "");
        const withoutGallery = axiosStub.post.mock.calls.at(-1)?.[1] as FormData;
        expect(withoutGallery.get("gallery_shortname")).toBeNull();

        respond(axiosStub.get, {list: ["/a"]});
        expect(await fileImportAPI.getImportDirMatch("/a")).toEqual({list: ["/a"]});
        expect(axiosStub.get).toHaveBeenLastCalledWith("/import-directory?path=/a");
    });

    it("refreshes gallery files", async () => {
        respond(axiosStub.get, {result: "OK"});
        expect(await fileSystemAPI.refreshGalleryFiles(12)).toEqual({result: "OK"});
        expect(axiosStub.get).toHaveBeenLastCalledWith("/refresh-gallery-files/12");

        respond(axiosStub.get, {task: {task_id: "t"}});
        expect(await fileSystemAPI.refreshAllGalleryFiles()).toEqual({task: {task_id: "t"}});
        expect(axiosStub.get).toHaveBeenLastCalledWith("/refresh-all-gallery-files");
    });

    it("lists and publishes galleries", async () => {
        const request = {page: 0, size: 25};
        respond(axiosStub.post, {content: []});
        await galleryAPI.findPageableWithoutFiles(request);
        expect(axiosStub.post).toHaveBeenLastCalledWith("paged-without-files", request);

        respond(axiosStub.post, {content: []});
        await galleryAPI.findPageableList(request);
        expect(axiosStub.post).toHaveBeenLastCalledWith("paged-list", request);

        respond(axiosStub.get, [{id: 12}]);
        expect(await galleryAPI.findAllByPage({details: QueryDetailEnum.MINIMAL}, 9)).toEqual([{id: 12}]);
        expect(axiosStub.get).toHaveBeenLastCalledWith("/page/9", {params: {details: "MINIMAL"}});

        respond(axiosStub.get, [{id: 12}]);
        expect(await galleryAPI.findListByPage(9)).toEqual([{id: 12}]);
        expect(axiosStub.get).toHaveBeenLastCalledWith("/page/9/list");

        const publish = {id: 12, publish_message: "", publish_schedule: false, publish_date_time: null};
        respond(axiosStub.patch, {result: "OK"});
        await galleryAPI.publish(publish);
        expect(axiosStub.patch).toHaveBeenLastCalledWith("/publish", publish);

        respond(axiosStub.get, {result: "OK"});
        await galleryAPI.publishAll();
        expect(axiosStub.get).toHaveBeenLastCalledWith("/publish", {params: undefined});

        respond(axiosStub.post, {result: "OK"});
        await galleryAPI.publishSelectedGalleries({gallery_ids: [1, 2]});
        expect(axiosStub.post).toHaveBeenLastCalledWith("/publish-selected", {gallery_ids: [1, 2]});
    });

    it("pages the site files", async () => {
        const request = {page: 0, size: 15, file_type: "IMAGE" as const};
        respond(axiosStub.post, {content: []});
        await siteFileAPI.getPagedSiteFiles(request);
        expect(axiosStub.post).toHaveBeenLastCalledWith("/paged", request);
    });
});
