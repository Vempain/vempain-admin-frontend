import { imageFileAPI } from "../services/Files";
import { ImageFileVO } from "../models/Responses/Files";
import type { ColumnsType } from "antd/es/table";
import { formatDateTimeWithMs } from "../tools";
import { GenericFileList } from "./GenericFileList";

export function ImageList() {
    const imageFileColumns: ColumnsType<ImageFileVO> = [
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
            <div className={"darkBody"}>
                <h1>Image List</h1>
                <GenericFileList<ImageFileVO>
                        valueObjectColumns={imageFileColumns}
                        api={imageFileAPI}
                />
            </div>
    );
}