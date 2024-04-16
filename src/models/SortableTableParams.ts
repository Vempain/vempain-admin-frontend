import {TablePaginationConfig} from "antd";
import {FilterValue} from "antd/es/table/interface";

export interface SortableTableParams {
    pagination: TablePaginationConfig;
    sortField: string;
    sortOrder: string;
    columnKey: string;
    field: string;
    order: string;
    filter: string;
    filters: Record<string, FilterValue | null>;
    filterColumn: string;
}