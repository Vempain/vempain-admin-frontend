import type {ColumnsType} from "antd/es/table";
import {Tag} from "antd";
import {GenericFileList} from "./GenericFileList";
import {siteFileAPI} from "../services";
import type {FileClassEnum, SiteFileResponse} from "../models";
import {formatDateTimeWithMs, formatFileSize} from "../tools";

interface Props {
  fileType: FileClassEnum;
  title?: string;
}

export function SiteFileList({ fileType, title }: Props) {
  const columns: ColumnsType<SiteFileResponse> = [
    {
      title: "Creator",
      dataIndex: "creator",
      key: "creator",
      sorter: true,
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "Created",
      dataIndex: "created",
      key: "created",
      sorter: true,
      sortDirections: ["descend", "ascend"],
      render: (_, record) => <>{formatDateTimeWithMs(record.created)}</>,
    },
    {
      title: "File name",
      dataIndex: "file_name",
      key: "file_name",
      sorter: true,
    },
    {
      title: "Path",
      dataIndex: "file_path",
      key: "file_path",
      ellipsis: true,
    },
    {
      title: "Class",
      dataIndex: "file_class",
      key: "file_class",
      filters: [
        { text: "ARCHIVE", value: "ARCHIVE" },
        { text: "AUDIO", value: "AUDIO" },
        { text: "DOCUMENT", value: "DOCUMENT" },
        { text: "IMAGE", value: "IMAGE" },
        { text: "VIDEO", value: "VIDEO" },
        { text: "VECTOR", value: "VECTOR" },
        { text: "ICON", value: "ICON" },
        { text: "FONT", value: "FONT" },
        { text: "EXECUTABLE", value: "EXECUTABLE" },
        { text: "INTERACTIVE", value: "INTERACTIVE" },
        { text: "DATA", value: "DATA" },
        { text: "BINARY", value: "BINARY" },
        { text: "THUMB", value: "THUMB" },
        { text: "UNKNOWN", value: "UNKNOWN" },
      ],
      render: (_, record) =>
        record.file_class ? <Tag>{record.file_class}</Tag> : null,
    },
    {
      title: "MIME type",
      dataIndex: "mime_type",
      key: "mime_type",
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      sorter: true,
      render: (_, record) => <>{formatFileSize(record.size)}</>,
    },
    {
      title: "SHA256",
      dataIndex: "sha256sum",
      key: "sha256sum",
      ellipsis: true,
    },
    {
      title: "Modified",
      dataIndex: "modified",
      key: "modified",
      sorter: true,
      render: (_, record) => <>{formatDateTimeWithMs(record.modified)}</>,
    },
  ];

  return (
    <div className="DarkDiv">
      {title ? <h1>{title}</h1> : null}
      <GenericFileList<SiteFileResponse>
        valueObjectColumns={columns}
        api={siteFileAPI}
        requestParams={{ file_type: fileType }}
      />
    </div>
  );
}

