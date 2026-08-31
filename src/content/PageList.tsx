import {useEffect, useRef, useState} from "react";
import {Button, Input, type InputRef, notification, Space, Spin, Switch, Table, type TableColumnType, type TablePaginationConfig} from "antd";
import type {ColumnsType} from "antd/lib/table";
import {Link} from "react-router-dom";
import {CloudUploadOutlined, DeleteOutlined, EditOutlined, PlusCircleFilled, SearchOutlined} from "@ant-design/icons";
import type {PageResponse} from "../models";
import {pageAPI} from "../services";
import dayjs from "dayjs";
import type {FilterDropdownProps, FilterValue, SorterResult} from "antd/es/table/interface";
import {PublishSchedule} from "./PublishSchedule";

// Define a hash containing the spin messages
const spinMessages: Record<string, string> = {
    loading: "Loading page list...",
    publishing: "Publishing all pages..."
};

export function PageList() {
    const [loading, setLoading] = useState<boolean>(false);
    const [pageList, setPageList] = useState<PageResponse[]>([]);
    const [spinMessage, setSpinMessage] = useState<string>(spinMessages.loading);
    const [pagination, setPagination] = useState<TablePaginationConfig>({});
    const [sortField, setSortField] = useState("id");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [reloadToken, setReloadToken] = useState(0);

    const [searchText, setSearchText] = useState("");
    const [searchedColumn, setSearchedColumn] = useState("");
    const [caseSensitive, setCaseSensitive] = useState(false);
    const searchInput = useRef<InputRef>(null);
    type DataIndex = keyof PageResponse;

    const [schedulePublish, setSchedulePublish] = useState<boolean>(false);
    const [publishDate, setPublishDate] = useState<dayjs.Dayjs | null>(null);

    const [api, contextHolder] = notification.useNotification();

    function handleSearch(
            selectedKeys: string[],
            confirm: FilterDropdownProps["confirm"],
            dataIndex: DataIndex,
    ) {
        confirm();
        setSearchText(selectedKeys[0]);
        setSearchedColumn(dataIndex);
        api.info({
            title: "Searching for '" + searchText + "' in " + searchedColumn,
            description: `Searching for "${selectedKeys[0]}" in ${dataIndex}`,
            duration: 2,
        });
    }

    function handleReset(clearFilters: () => void) {
        clearFilters();
        setSearchText("");
    }

    const getColumnSearchProps = (dataIndex: DataIndex): TableColumnType<PageResponse> => ({
        filterDropdown: ({setSelectedKeys, selectedKeys, confirm, clearFilters, close}) => (
                <div style={{padding: 8}} onKeyDown={(e) => e.stopPropagation()}>
                    <Input
                            ref={searchInput}
                            placeholder={`Search ${dataIndex}`}
                            value={selectedKeys[0]}
                            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                            onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
                            style={{marginBottom: 8, display: "block"}}
                    />
                    <Space>
                        <Button
                                type="primary"
                                onClick={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
                                icon={<SearchOutlined/>}
                                size="small"
                                style={{width: 90}}
                        >
                            Search
                        </Button>
                        <Button
                                onClick={() => clearFilters && handleReset(clearFilters)}
                                size="small"
                                style={{width: 90}}
                        >
                            Reset
                        </Button>
                        <Button
                                type="link"
                                size="small"
                                onClick={() => {
                                    confirm({closeDropdown: false});
                                    setSearchText((selectedKeys as string[])[0]);
                                    setSearchedColumn(dataIndex);
                                }}
                        >
                            Filter
                        </Button>
                        <Button
                                type="link"
                                size="small"
                                onClick={() => {
                                    close();
                                }}
                        >
                            close
                        </Button>
                    </Space>
                </div>
        ),
        filterIcon: (filtered: boolean) => (
                <SearchOutlined style={{color: filtered ? "#1677ff" : undefined}}/>
        ),
        filteredValue: searchText && searchedColumn === dataIndex ? [searchText] : null,
        filterDropdownProps: {
            onOpenChange: (visible) => {
                if (visible) {
                    setTimeout(() => searchInput.current?.select(), 100);
                }
            }
        },
    });

    const columns: ColumnsType<PageResponse> = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            sorter: true
        },
        {
            title: "Parent ID",
            dataIndex: "parent_id",
            key: "parent_id",
            sorter: true
        },
        {
            title: "Form ID",
            dataIndex: "form_id",
            key: "form_id",
            sorter: true
        },
        {
            title: "Path",
            dataIndex: "page_path",
            key: "page_path",
            sorter: true,
            ...getColumnSearchProps("page_path")
        },
        {
            title: "Secure",
            dataIndex: "secure",
            key: "secure",
            sorter: true
        },
        {
            title: "Index List",
            dataIndex: "index_list",
            key: "index_list",
            sorter: true
        },
        {
            title: "Title",
            dataIndex: "title",
            key: "title",
            sorter: true,
            ...getColumnSearchProps("title")
        },
        {
            title: "Locked",
            dataIndex: "locked",
            key: "locked",
            sorter: true
        },
        {
            title: "Creator",
            dataIndex: "creator",
            key: "creator",
            sorter: true
        },
        {
            title: "Created",
            dataIndex: "created",
            key: "created",
            sorter: true,
            render: (_text: string, record: PageResponse) => {
                return (<>{dayjs(record.created).format("YYYY.MM.DD HH:mm")}</>);
            }
        },
        {
            title: "Modifier",
            dataIndex: "modifier",
            key: "modifier",
            sorter: true,
        },
        {
            title: "Modified",
            dataIndex: "modified",
            key: "modified",
            sorter: true,
            render: (_text: string, record: PageResponse) => {
                if (record.modified === null) {
                    return (<>-</>);
                }

                return (<>{dayjs(record.modified).format("YYYY.MM.DD HH:mm")}</>);
            }
        },
        {
            title: "Published",
            dataIndex: "published",
            key: "published",
            sorter: true,
            render: (_text: string, record: PageResponse) => {
                if (record.published === null) {
                    return (<>-</>);
                }

                return (<>{dayjs(record.published).format("YYYY.MM.DD HH:mm")}</>);
            }
        },
        {
            title: "Action",
            key: "action",
            render: (_text: Record<string, unknown>, record: PageResponse) => (
                    <Space>
                        <Button type="primary" href={`/pages/${record.id}/edit`}><EditOutlined/></Button>
                        <Button type={"primary"} danger href={`/pages/${record.id}/delete`}><DeleteOutlined/></Button>
                        <Button type={"primary"} style={{background: "green"}} href={`/pages/${record.id}/publish`}><CloudUploadOutlined/></Button>
                    </Space>
            ),
        },
    ];

    function handleTableChange(nextPagination: TablePaginationConfig, filters: Record<string, FilterValue | null>,
                               sorter: SorterResult<PageResponse> | SorterResult<PageResponse>[]): void {
        const tableSorter = Array.isArray(sorter) ? sorter[0] : sorter;
        const search = Object.values(filters).flatMap(value => value ?? []).find(value => typeof value === "string" && value.length > 0);
        setPagination(nextPagination);
        setSortField(tableSorter.field?.toString() || "id");
        setSortOrder(tableSorter.order === "descend" ? "desc" : "asc");
        setSearchText(typeof search === "string" ? search : "");
        setSearchedColumn(typeof search === "string" ? Object.keys(filters).find(key => filters[key]?.includes(search)) ?? "" : "");
    }

    const currentPage = pagination.current ?? 1;
    const currentPageSize = pagination.pageSize ?? 25;

    useEffect(() => {
        setSpinMessage(spinMessages.loading);
        setLoading(true);

        pageAPI.findPageable({
            page: currentPage - 1,
            size: currentPageSize,
            sort_by: sortField,
            direction: sortOrder === "desc" ? "DESC" : "ASC",
            search: searchText || undefined
            , case_sensitive: caseSensitive
        })
                .then((response) => {
                    setPageList(response.content);
                    setPagination(current => ({
                        ...current,
                        current: response.page + 1,
                        pageSize: response.size,
                        total: response.total_elements
                    }));
                })
                .catch((error) => {
                    console.error(error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [currentPage, currentPageSize, reloadToken, searchText, sortField, sortOrder]);

    function publishAll(): void {
        const publishAll = window.confirm("Are you sure you want to publish all " + pageList.length + " pages?");

        if (!publishAll) {
            return;
        }

        setSpinMessage(spinMessages.publishing);
        setLoading(true);

        let publishParams: Record<string, string> | undefined = undefined;

        if (schedulePublish && publishDate !== null) {
            publishParams = {publish_date: publishDate.format("YYYY-MM-DDTHH:mm:ssZ")};
        }

        pageAPI.publishAll(publishParams)
                .then(() => {
                    setReloadToken((current) => current + 1);
                })
                .catch((_error) => {
                    console.error("Error publishing all pages");
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    return (
            <div className={"DarkDiv"} key={"pageListDiv"}>
                {contextHolder}
                <Spin description={spinMessage} spinning={loading} key={"pageListSpinner"}>
                    <Space vertical={true} size={"large"} key={"pageListSpace"}>
                        <h1 key={"pageListHeader"}>Page List <Link to={"/pages/0/edit"}><PlusCircleFilled/></Link>
                            <Switch checked={caseSensitive} onChange={checked => {
                                setCaseSensitive(checked);
                                setPagination(current => ({...current, current: 1}));
                            }}
                                    checkedChildren="Aa" unCheckedChildren="aa" style={{marginLeft: 16}}/>
                        </h1>
                        <Button type={"primary"} onClick={publishAll}>Publish all pages</Button>
                        <PublishSchedule setSchedulePublish={setSchedulePublish} setPublishDate={setPublishDate}/>
                        <Table
                                dataSource={pageList.map((item, index) => ({...item, key: `row_${index}`}))}
                                columns={columns}
                                pagination={pagination}
                                onChange={handleTableChange}
                                key={"pageListTable"}/>
                    </Space>
                </Spin>
            </div>
    );
}
