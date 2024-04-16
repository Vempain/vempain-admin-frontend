import { audioFileAPI } from "../services/Files";
import { AudioFileVO } from "../models/Responses/Files";
import type { ColumnsType } from "antd/es/table";
import { formatDateTimeWithMs } from "../tools";
import { GenericFileList } from "./GenericFileList";

export function AudioList() {
    const audioFileColumns: ColumnsType<AudioFileVO> = [
        {
            title: "Creator",
            dataIndex: 'common.creator',
            key: 'creator',
            sorter: true,
            sortDirections: ['descend', 'ascend'],
            render: (_, record) => {
                return (<>{record.common.creator}</>);
            }
        },
        {
            title: "Created",
            dataIndex: 'common.created',
            key: 'created',
            sorter: true,
            sortDirections: ['descend', 'ascend'],
            render: (_, record) => {
                return (<>{formatDateTimeWithMs(record.common.created)}</>);
            }
        },
        {
            title: "Source file",
            dataIndex: 'common.converted_file',
            key: 'app_file',
            render: (_, record) => {
                return (<>{record.common.converted_file}</>);
            }
        },
    ];

    return (
            <div>
                <GenericFileList<AudioFileVO>
                        valueObjectColumns={audioFileColumns}
                        api={audioFileAPI}
                />
            </div>
    );
}