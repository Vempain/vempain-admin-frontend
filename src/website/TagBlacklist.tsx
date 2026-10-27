import {Button, Form, Input, message, Popconfirm, Spin, Table, Typography} from "antd";
import type {ColumnsType} from "antd/es/table";
import {DeleteOutlined, PlusCircleFilled, TagsOutlined} from "@ant-design/icons";
import {UserName} from "@vempain/vempain-auth-frontend";
import dayjs from "dayjs";
import {useCallback, useEffect, useState} from "react";
import type {TagBlacklistRequest, TagBlacklistResponse} from "../models";
import {tagBlacklistAPI, userAPI} from "../services";
import {formatDateTime, stickyTableHeader} from "../tools";

/**
 * The tags that are never published to the website: a blacklisted tag is left out of the subjects of every published file and removed from the keyword
 * lists of the file metadata the website shows. Changes apply to the next publish of each resource.
 */
export function TagBlacklist() {
    const [entries, setEntries] = useState<TagBlacklistResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [form] = Form.useForm<TagBlacklistRequest>();

    const load = useCallback(() => {
        setLoading(true);
        tagBlacklistAPI.list()
                .then(setEntries)
                .catch(() => message.error("Failed to load the tag blacklist"))
                .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const add = (request: TagBlacklistRequest) => {
        setSubmitting(true);
        tagBlacklistAPI.add({tag_name: request.tag_name.trim()})
                .then(entry => {
                    message.success(`Tag "${entry.tag_name}" blacklisted`);
                    form.resetFields();
                    load();
                })
                .catch(error => {
                    const status = (error as { response?: { status?: number } })?.response?.status;
                    message.error(status === 409 ? "The tag is already blacklisted" : "Failed to blacklist the tag");
                })
                .finally(() => setSubmitting(false));
    };

    const remove = (entry: TagBlacklistResponse) => {
        tagBlacklistAPI.remove(entry.id)
                .then(() => {
                    message.success(`Tag "${entry.tag_name}" removed from the blacklist`);
                    load();
                })
                .catch(() => message.error("Failed to remove the tag from the blacklist"));
    };

    const columns: ColumnsType<TagBlacklistResponse> = [
        {title: "Tag", dataIndex: "tag_name", key: "tag_name", sorter: (a, b) => a.tag_name.localeCompare(b.tag_name)},
        {title: "Added by", dataIndex: "created_by", key: "created_by", render: (id: number) => <UserName userAPI={userAPI} id={id}/>},
        {title: "Added", dataIndex: "created", key: "created", render: (value: string) => formatDateTime(dayjs(value))},
        {
            title: "Actions", key: "actions", width: 100,
            render: (_value: unknown, record: TagBlacklistResponse) => (
                    <Popconfirm title="Remove this tag from the blacklist?" description="It is published again the next time its files are published."
                                okText="Remove" cancelText="Cancel" onConfirm={() => remove(record)}>
                        <Button danger icon={<DeleteOutlined/>} aria-label={`Remove tag ${record.tag_name}`}/>
                    </Popconfirm>
            )
        }
    ];

    return (
            <div className={"DarkDiv"}>
                <h1><TagsOutlined/> Tag blacklist</h1>
                <Typography.Paragraph type="secondary">
                    Tags listed here never reach the website: they are left out of the subjects of every published file and removed from the keyword
                    lists of the file metadata. Matching ignores case, and a hierarchical tag is removed when any of its levels is blacklisted. Already
                    published resources are cleaned when they are published again.
                </Typography.Paragraph>
                <Form form={form} layout="inline" onFinish={add} style={{marginBottom: 16}}>
                    <Form.Item name="tag_name" rules={[{required: true, whitespace: true, max: 255, message: "Enter a tag"}]}>
                        <Input placeholder="Tag to blacklist" aria-label="Tag to blacklist" style={{width: 320}}/>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" icon={<PlusCircleFilled/>} loading={submitting}>Blacklist tag</Button>
                    </Form.Item>
                </Form>
                <Spin spinning={loading}>
                    <Table dataSource={entries} columns={columns} rowKey="id" pagination={false} scroll={{x: "max-content"}} sticky={stickyTableHeader}
                           locale={{emptyText: "No tags are blacklisted"}}/>
                </Spin>
            </div>
    );
}
