import type {DocumentFileVO} from "../models";
import {documentFileAPI} from "../services";
import {GenericFileList} from "./GenericFileList";
import type {ColumnsType} from "antd/es/table";
import {formatDateTimeWithMs} from "../tools";

export function DocumentList() {
    const documentFileColumns: ColumnsType<DocumentFileVO> = [
        {
            title: "Creator",
            dataIndex: "common.creator",
            key: "creator",
            sorter: true,
            sortDirections: ["descend", "ascend"],
            render: (_, record) => {
                return (<>{record.common.creator}</>);
            }
        },
        {
            title: "Created",
            dataIndex: "common.created",
            key: "created",
            sorter: true,
            sortDirections: ["descend", "ascend"],
            render: (_, record) => {
                return (<>{formatDateTimeWithMs(record.common.created)}</>);
            }
        },
        {
            title: "Source file",
            dataIndex: "common.converted_file",
            key: "app_file",
            render: (_, record) => {
                return (<>{record.common.converted_file}</>);
            }
        },
    ];

    return (
            <div>
                <GenericFileList<DocumentFileVO>
                        valueObjectColumns={documentFileColumns}
                        api={documentFileAPI}
                />
            </div>
    );
}