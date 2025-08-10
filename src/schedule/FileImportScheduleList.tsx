import {useEffect, useState} from "react";
import {Spin, Table} from "antd";
import type {ColumnsType} from "antd/lib/table";
import {scheduleAPI} from "../services";
import type {FileImportScheduleResponse} from "../models";
import {CheckOutlined} from "@ant-design/icons";

function FileImportScheduleList() {
    const [loading, setLoading] = useState<boolean>(true);
    const [systemScheduleList, setSystemScheduleList] = useState<FileImportScheduleResponse[]>([]);

    const columns: ColumnsType<FileImportScheduleResponse> = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            defaultSortOrder: "descend",
            sorter: (a, b) => a.id - b.id
        },
        {
            title: "Source directory",
            dataIndex: "source_directory",
            key: "source_directory",
            defaultSortOrder: "descend",
            sorter: (a, b) => a.source_directory.localeCompare(b.source_directory),
        },
        {
            title: "Destination directory",
            dataIndex: "destination_directory",
            key: "destination_directory",
            defaultSortOrder: "descend",
            sorter: (a, b) => a.destination_directory.localeCompare(b.destination_directory),
        },
        {
            title: "Generate gallery",
            dataIndex: "generate_gallery",
            key: "generate_gallery",
            render: (_text: any, record: any) => {
                if (record.generate_gallery) {
                    return <CheckOutlined/>;
                }
            }
        },
        {
            title: "Gallery shortname",
            dataIndex: "gallery_shortname",
            key: "gallery_shortname",
            defaultSortOrder: "descend",
            sorter: (a, b) => a.gallery_shortname.localeCompare(b.gallery_shortname),
        },
        {
            title: "Generate page",
            dataIndex: "generate_page",
            key: "generate_page",
            render: (_text: any, record: any) => {
                if (record.generate_page) {
                    return <CheckOutlined/>;
                }
            }
        },
        {
            title: "Page title",
            dataIndex: "page_title",
            key: "page_title",
            defaultSortOrder: "descend",
            sorter: (a, b) => a.gallery_shortname.localeCompare(b.gallery_shortname),
        },
        {
            title: "Page path",
            dataIndex: "page_path",
            key: "page_path",
            defaultSortOrder: "descend",
            sorter: (a, b) => a.page_path.localeCompare(b.page_path),
        }
    ];

    useEffect(() => {
        setLoading(true);

        scheduleAPI.getFileImportSchedules()
                .then((response) => {
                    setSystemScheduleList(response);
                })
                .catch((error) => {
                    console.error(error);
                })
                .finally(() => {
                    setLoading(false);
                });

    }, []);

    return (
            <div className={"darkBody"} key={"layoutListDiv"}>
                <Spin tip={"Loading"} spinning={loading} key={"fileImportScheduleListSpinner"}>
                    <h1 key={"fileImportScheduleListHeader"}>File import schedule List</h1>

                    {systemScheduleList.length > 0 && <Table
                            dataSource={systemScheduleList}
                            columns={columns}
                            key={"fileImportScheduleListTable"}/>}
                    {systemScheduleList.length === 0 && <h2>No file import schedules found</h2>}
                </Spin>
            </div>
    );
}

export {FileImportScheduleList};