export interface DataSummaryResponse {
    id: number;
    identifier: string;
    type: string;
    description: string | null;
    column_definitions: string;
    create_sql: string;
    fetch_all_sql: string;
    fetch_subset_sql: string;
    generated: string;
    created_at: string;
    updated_at: string;
}

