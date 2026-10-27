import dayjs from "dayjs";
import type {AclVO, PagedResponse} from "@vempain/vempain-auth-frontend";
import type {
    ComponentVO,
    FileGroupListResponse,
    FormVO,
    GalleryResponse,
    LayoutVO,
    PageResponse,
    PublishScheduleResponse,
    ScheduleTriggerResponse,
    SiteFileResponse,
    WebSiteConfigurationResponse,
    WebSiteResourceResponse,
    WebSiteUserResponse
} from "../../models";
import {ContentTypeEnum, FileTypeEnum, PublishStatusEnum, WebSiteConfigurationTypeEnum, WebSiteResourceTypeEnum} from "../../models";

/** The signed-in administrator of the screen tests */
export const SESSION_USER_ID = 7;

export const CREATED = "2026-01-02T10:00:00Z";
export const MODIFIED = "2026-01-03T11:30:00Z";

export function acl(overrides: Partial<AclVO> = {}): AclVO {
    return {
        permission_id: 1,
        acl_id: 100,
        user: SESSION_USER_ID,
        unit: null,
        create_privilege: true,
        read_privilege: true,
        modify_privilege: true,
        delete_privilege: true,
        ...overrides
    };
}

export function pagedResponse<T>(content: T[], overrides: Partial<PagedResponse<T>> = {}): PagedResponse<T> {
    return {
        content,
        page: 0,
        size: content.length,
        total_elements: content.length,
        total_pages: 1,
        first: true,
        last: true,
        empty: content.length === 0,
        ...overrides
    };
}

export function componentVO(overrides: Partial<ComponentVO> = {}): ComponentVO {
    return {
        id: 3,
        comp_name: "Header component",
        comp_data: "<header/>",
        acls: [acl()],
        locked: false,
        creator: 1,
        created: dayjs(CREATED),
        modifier: 2,
        modified: dayjs(MODIFIED),
        ...overrides
    };
}

export function layoutVO(overrides: Partial<LayoutVO> = {}): LayoutVO {
    return {
        id: 4,
        layout_name: "Main layout",
        structure: "<!--comp-->",
        acls: [acl()],
        locked: false,
        creator: 1,
        created: dayjs(CREATED),
        modifier: null,
        modified: null,
        ...overrides
    };
}

export function formVO(overrides: Partial<FormVO> = {}): FormVO {
    return {
        id: 5,
        name: "Article form",
        layout_id: 4,
        components: [componentVO()],
        acls: [acl()],
        locked: false,
        creator: 1,
        created: dayjs(CREATED),
        modifier: 2,
        modified: dayjs(MODIFIED),
        ...overrides
    };
}

export function pageResponse(overrides: Partial<PageResponse> = {}): PageResponse {
    return {
        id: 9,
        parent_id: 0,
        form_id: 5,
        page_path: "/news/first",
        secure: false,
        index_list: true,
        title: "First page",
        header: "First",
        body: "<p>Hello</p>",
        acls: [acl()],
        locked: false,
        creator: 1,
        created: dayjs(CREATED),
        modifier: 2,
        modified: dayjs(MODIFIED),
        published: null,
        tags: [],
        ...overrides
    };
}

export function siteFile(overrides: Partial<SiteFileResponse> = {}): SiteFileResponse {
    return {
        id: 21,
        file_name: "sunset.jpg",
        file_path: "/2026/sunset.jpg",
        file_type: FileTypeEnum.IMAGE,
        mime_type: "image/jpeg",
        size: 2048,
        sha256sum: "abc123",
        creator: 1,
        created: CREATED,
        modifier: null,
        modified: null,
        comment: null,
        metadata: null,
        original_date_time: "2025-12-24T12:00:00Z",
        rights_holder: null,
        rights_terms: null,
        rights_url: null,
        creator_name: null,
        creator_email: null,
        creator_country: null,
        creator_url: null,
        location: null,
        published: null,
        ...overrides
    };
}

export function galleryResponse(overrides: Partial<GalleryResponse> = {}): GalleryResponse {
    return {
        id: 12,
        short_name: "Summer",
        description: "Summer pictures",
        site_files: [siteFile()],
        acls: [acl()],
        locked: false,
        creator: 1,
        created: dayjs(CREATED),
        modifier: null,
        modified: null,
        published: null,
        ...overrides
    };
}

export function fileGroupListResponse(overrides: Partial<FileGroupListResponse> = {}): FileGroupListResponse {
    return {
        id: 12,
        short_name: "Summer",
        description: "Summer pictures",
        file_count: 3,
        acls: [acl()],
        locked: false,
        creator: 1,
        created: dayjs(CREATED),
        modifier: null,
        modified: null,
        published: null,
        ...overrides
    };
}

export function publishSchedule(overrides: Partial<PublishScheduleResponse> = {}): PublishScheduleResponse {
    return {
        id: 31,
        publish_time: dayjs("2026-02-01T09:00:00Z"),
        publish_status: PublishStatusEnum.NOT_PUBLISHED,
        publish_message: "Release notes",
        publish_type: ContentTypeEnum.PAGE,
        publish_id: 9,
        created_at: dayjs(CREATED),
        updated_at: dayjs(MODIFIED),
        ...overrides
    };
}

export function systemSchedule(overrides: Partial<ScheduleTriggerResponse> = {}): ScheduleTriggerResponse {
    return {id: 41, schedule_name: "nightly-cleanup", status: "IDLE", ...overrides};
}

export function webSiteUser(overrides: Partial<WebSiteUserResponse> = {}): WebSiteUserResponse {
    return {
        id: 51,
        username: "reader",
        creator: 1,
        created: CREATED,
        modifier: null,
        modified: null,
        global_permission: false,
        resources: [],
        ...overrides
    };
}

export function webSiteResource(overrides: Partial<WebSiteResourceResponse> = {}): WebSiteResourceResponse {
    return {
        resource_type: WebSiteResourceTypeEnum.PAGE,
        resource_id: 9,
        name: "First page",
        path: "/news/first",
        acl_id: 100,
        ...overrides
    };
}

export function webSiteConfiguration(overrides: Partial<WebSiteConfigurationResponse> = {}): WebSiteConfigurationResponse {
    return {
        id: "site.title",
        config_key: "site.title",
        config_type: WebSiteConfigurationTypeEnum.STRING,
        config_default: "Vempain",
        config_value: "My site",
        creator: null,
        created: null,
        modifier: null,
        modified: null,
        ...overrides
    };
}
