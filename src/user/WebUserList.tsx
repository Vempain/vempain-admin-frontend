import {PlusOutlined} from "@ant-design/icons";
import {Button, Form, Input, message, Modal, Space, Table, Typography} from "antd";
import type {ColumnsType} from "antd/es/table";
import {useCallback, useEffect, useMemo, useState} from "react";
import type {WebSiteUserRequest, WebSiteUserResponse} from "../models";
import {siteWebAccessApi} from "../services/SiteWebAccessAPI";

export function WebUserList() {
    const [users, setUsers] = useState<WebSiteUserResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingUser, setEditingUser] = useState<WebSiteUserResponse | null>(null);
    const [form] = Form.useForm<WebSiteUserRequest>();

    const resolveUserId = (user: WebSiteUserResponse | null): number | null => {
        if (!user) {
            return null;
        }
        const enriched = user as WebSiteUserResponse & {id?: number; user_id?: number};
        return enriched.id ?? enriched.user_id ?? null;
    };

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await siteWebAccessApi.getAllWebUsers();
            setUsers(data);
        } catch (err) {
            message.error("Failed to load web users");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadUsers();
    }, [loadUsers]);

    const openCreateModal = () => {
        setEditingUser(null);
        form.resetFields();
        setModalOpen(true);
    };

    const openEditModal = (user: WebSiteUserResponse) => {
        setEditingUser(user);
        form.setFieldsValue({username: user.username, password: ""});
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingUser(null);
        form.resetFields();
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);
            if (editingUser) {
                const userId = resolveUserId(editingUser);
                if (userId === null) {
                    message.error("Missing user identifier");
                    return;
                }
                await siteWebAccessApi.updateWebUser(userId, values);
                message.success("Web user updated");
            } else {
                await siteWebAccessApi.createWebUser(values);
                message.success("Web user created");
            }
            closeModal();
            await loadUsers();
        } catch (err) {
            console.error(err);
            message.error("Operation failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (user: WebSiteUserResponse) => {
        const userId = resolveUserId(user);
        if (userId === null) {
            message.error("Missing user identifier");
            return;
        }
        Modal.confirm({
            title: `Delete ${user.username}?`,
            content: "This will remove the user and its ACL entries.",
            okText: "Delete",
            okType: "danger",
            onOk: async () => {
                try {
                    await siteWebAccessApi.deleteWebUser(userId);
                    message.success("Web user deleted");
                    await loadUsers();
                } catch {
                    message.error("Failed to delete web user");
                }
            }
        });
    };

    const columns: ColumnsType<WebSiteUserResponse> = useMemo(() => [
        {
            title: "ID",
            dataIndex: "id",
            render: (_, record) => resolveUserId(record) ?? "-"
        },
        {
            title: "Username",
            dataIndex: "username"
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Space>
                    <Button size="small" onClick={() => openEditModal(record)}>Edit</Button>
                    <Button size="small" danger onClick={() => handleDelete(record)}>Delete</Button>
                </Space>
            )
        }
    ], []);

    return (
        <>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16}}>
                <Typography.Title level={3} style={{margin: 0}}>Web Users</Typography.Title>
                <Button type="primary" shape="circle" icon={<PlusOutlined />} onClick={openCreateModal} />
            </div>

            <Table<WebSiteUserResponse>
                rowKey={(record) => String(resolveUserId(record) ?? record.username)}
                columns={columns}
                dataSource={users}
                loading={loading}
                pagination={false}
            />

            <Modal
                open={modalOpen}
                title={editingUser ? `Edit ${editingUser.username}` : "Create Web User"}
                onOk={handleSubmit}
                onCancel={closeModal}
                confirmLoading={submitting}
                destroyOnClose
            >
                <Form form={form} layout="vertical" preserve={false}>
                    <Form.Item
                        label="Username"
                        name="username"
                        rules={[{required: true, message: "Username is required"}]}
                    >
                        <Input autoFocus />
                    </Form.Item>
                    <Form.Item
                        label="Password"
                        name="password"
                        rules={editingUser ? [] : [{required: true, message: "Password is required"}]}
                    >
                        <Input.Password placeholder={editingUser ? "Leave blank to keep current password" : ""} />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
}
