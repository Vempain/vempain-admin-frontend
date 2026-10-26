/** Number of resources sharing a name (a file type, form, layout, component or path); mirrors StatisticsCount of the admin backend */
export interface StatisticsCount {
    name: string;
    count: number;
}

/** Published versus unpublished resources of one type (page, gallery, site_file) */
export interface StatisticsPublishState {
    resource_type: string;
    published: number;
    not_published: number;
}

/** Resources of one type created or published in one calendar month (`YYYY-MM`, UTC) */
export interface StatisticsMonthlyCount {
    resource_type: string;
    month: string;
    count: number;
}

/** Resources of one type created by one user; the nick is null when the account no longer exists */
export interface StatisticsUserCount {
    user_id: number;
    nick: string | null;
    resource_type: string;
    count: number;
}

/** Counts and breakdowns of the resources of the admin backend (`GET /admin-management/statistics`); system wide, not filtered by ACL */
export interface AdminStatisticsResponse {
    generated_at: string;
    resource_counts: StatisticsCount[];
    files_by_type: StatisticsCount[];
    publish_states: StatisticsPublishState[];
    published_by_month: StatisticsMonthlyCount[];
    created_by_month: StatisticsMonthlyCount[];
    resources_by_user: StatisticsUserCount[];
    pages_by_form: StatisticsCount[];
    forms_by_layout: StatisticsCount[];
    forms_by_component: StatisticsCount[];
    pages_by_path: StatisticsCount[];
    files_by_path: StatisticsCount[];
}
