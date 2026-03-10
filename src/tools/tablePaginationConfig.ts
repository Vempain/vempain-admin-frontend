import type {TablePaginationConfig} from 'antd/es/table';

const tablePaginationConfig: TablePaginationConfig = {
    placement: ["topEnd", "bottomEnd"],
    defaultPageSize: 15,
    hideOnSinglePage: true,
    showSizeChanger: true,
    showQuickJumper: true,
    pageSizeOptions: ["5", "10", "15", "20", "30", "50", "100"]
};

export const getPaginationConfig = (total: number): TablePaginationConfig => ({
    ...tablePaginationConfig,
    total
});