import {useEffect, useRef, useState} from "react";
import {Button, Input, type InputRef, notification, Space, Spin, Table, type TableColumnType, type TablePaginationConfig} from "antd";
import type {ColumnsType} from "antd/lib/table";
import {Link} from "react-router-dom";
import {PlusCircleFilled, SearchOutlined} from "@ant-design/icons";
import {type PageVO, QueryDetailEnum} from "../models";
import {pageAPI} from "../services";
import dayjs from "dayjs";
import {getPaginationConfig} from "../tools";
import type {FilterDropdownProps} from "antd/es/table/interface";
import {PublishSchedule} from "./PublishSchedule";

// Define a hash containing the spin messages
const spinMessages: Record<string, string> = {
    loading: "Loading page list...",
    publishing: "Publishing all pages..."
};

export function PageList() {
    const [loading, setLoading] = useState<boolean>(false);
    const [pageList, setPageList] = useState<PageVO[]>([]);
    const [spinMessage, setSpinMessage] = useState<string>(spinMessages.loading);
    const [pagination, setPagination] = useState<TablePaginationConfig>({});

    const [searchText, setSearchText] = useState("");
    const [searchedColumn, setSearchedColumn] = useState("");
    const searchInput = useRef<InputRef>(null);
    type DataIndex = keyof PageVO;

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
            message: "Searching for '" + searchText + "' in " + searchedColumn,
            description: `Searching for "${selectedKeys[0]}" in ${dataIndex}`,
            duration: 2,
        });
    }

    function handleReset(clearFilters: () => void) {
        clearFilters();
        setSearchText("");
    }

    const getColumnSearchProps = (dataIndex: DataIndex): TableColumnType<PageVO> => ({
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
        onFilter: (value, record) => {
            if (record !== null && dataIndex !== null && record[dataIndex] !== null && value !== null) {
                // @ts-ignore
                return record[dataIndex]
                        .toString()
                        .toLowerCase()
                        .includes((value as string).toLowerCase());
            }

            return false;
        },
        filterDropdownProps: {
            onOpenChange: (visible) => {
                if (visible) {
                    setTimeout(() => searchInput.current?.select(), 100);
                }
            }
        },
        // render: (text) =>
        //         searchedColumn === dataIndex ? (
        //                 <Highlighter
        //                         highlightStyle={{backgroundColor: "#ffc069", padding: 0}}
        //                         searchWords={[searchText]}
        //                         autoEscape
        //                         textToHighlight={text ? text.toString() : ""}
        //                 />
        //         ) : (
        //                 text
        //         ),
    });

    const columns: ColumnsType<PageVO> = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            sorter: (a, b) => a.id - b.id
        },
        {
            title: "Parent ID",
            dataIndex: "parent_id",
            key: "parent_id",
            sorter: (a, b) => a.parent_id - b.parent_id
        },
        {
            title: "Form ID",
            dataIndex: "form_id",
            key: "form_id",
            sorter: (a, b) => a.form_id - b.form_id
        },
        {
            title: "Path",
            dataIndex: "path",
            key: "path",
            sorter: (a, b) => a.path.localeCompare(b.path),
            ...getColumnSearchProps("path")
        },
        {
            title: "Secure",
            dataIndex: "secure",
            key: "secure",
            sorter: (a, b) => Number(b.secure) - Number(a.secure)
        },
        {
            title: "Index List",
            dataIndex: "index_list",
            key: "index_list",
            sorter: (a, b) => Number(b.index_list) - Number(a.index_list)
        },
        {
            title: "Title",
            dataIndex: "title",
            key: "title",
            sorter: (a, b) => a.title.localeCompare(b.title),
            ...getColumnSearchProps("title")
        },
        {
            title: "Locked",
            dataIndex: "locked",
            key: "locked",
            sorter: (a, b) => Number(b.locked) - Number(a.locked)
        },
        {
            title: "Creator",
            dataIndex: "creator",
            key: "creator",
            sorter: (a, b) => a.creator - b.creator
        },
        {
            title: "Created",
            dataIndex: "created",
            key: "created",
            sorter: (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime(),
            render: (_text: string, record: PageVO) => {
                return (<>{dayjs(record.created).format("YYYY.MM.DD HH:mm")}</>);
            }
        },
        {
            title: "Modifier",
            dataIndex: "modifier",
            key: "modifier",
            sorter: (a, b) => a.modifier - b.modifier,
        },
        {
            title: "Modified",
            dataIndex: "modified",
            key: "modified",
            sorter: (a, b) => new Date(a.modified).getTime() - new Date(b.modified).getTime(),
            render: (_text: string, record: PageVO) => {
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
            sorter: (a, b) => {
                if (a.published === null && b.published === null) {
                    return 0;
                }

                if (a.published === null) {
                    return -1;
                }

                if (b.published === null) {
                    return 1;
                }

                return (new Date(a.published).getTime() - new Date(b.published).getTime());
            },
            render: (_text: string, record: PageVO) => {
                if (record.published === null) {
                    return (<>-</>);
                }

                return (<>{dayjs(record.published).format("YYYY.MM.DD HH:mm")}</>);
            }
        },
        {
            title: "Action",
            key: "action",
            render: (_text: any, record: PageVO) => (
                    <Space>
                        <Button type="primary" href={`/pages/${record.id}/edit`}>Edit</Button>
                        <Button type={"primary"} danger href={`/pages/${record.id}/delete`}>Delete</Button>
                        <Button type={"primary"} style={{background: "green"}} href={`/pages/${record.id}/publish`}>Publish</Button>
                    </Space>
            ),
        },
    ];

    useEffect(() => {
        setSpinMessage(spinMessages.loading);
        setLoading(true);

        pageAPI.findAll({details: QueryDetailEnum.UNPOPULATED})
                .then((response) => {
                    setPageList(response);
                    setPagination(getPaginationConfig(response.length));
                })
                .catch((error) => {
                    console.error(error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, []);

    function publishAll(): void {
        const publishAll = window.confirm("Are you sure you want to publish all " + pageList.length + " pages?");

        if (!publishAll) {
            return;
        }

        setSpinMessage(spinMessages.publishing);
        setLoading(true);

        let publishParams: Record<string, any> | undefined = undefined;

        if (schedulePublish && publishDate !== null) {
            publishParams = {publish_date: publishDate.format("YYYY-MM-DDTHH:mm:ssZ")};
        }

        pageAPI.publishAll(publishParams)
                .then(() => {
                    setLoading(true);
                    pageAPI.findAll({details: QueryDetailEnum.UNPOPULATED})
                            .then((response) => {
                                // This actually responds with: {"result":"OK","message":"Successfully published all pages","timestamp":"2024-04-02T20:02:01.247530395Z"}
                                // TODO Handle the response
                                setPageList(response);
                            })
                            .catch((error) => {
                                console.error("Error fetching page list:", error);
                            })
                            .finally(() => {
                                setLoading(false);
                            });
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
                <Spin tip={spinMessage} spinning={loading} key={"pageListSpinner"}>
                    <Space vertical={true} size={"large"} key={"pageListSpace"}>
                        <h1 key={"pageListHeader"}>Page List <Link to={"/pages/0/edit"}><PlusCircleFilled/></Link></h1>
                        <Button type={"primary"} onClick={publishAll}>Publish all pages</Button>
                        <PublishSchedule setSchedulePublish={setSchedulePublish} setPublishDate={setPublishDate}/>
                        {pageList.length > 0 && <Table
                                dataSource={pageList.map((item, index) => ({...item, key: `row_${index}`}))}
                                columns={columns}
                                pagination={pagination}
                                key={"pageListTable"}/>}
                    </Space>
                </Spin>
            </div>
    );
}
