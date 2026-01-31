import {DeleteOutlined, EditOutlined, GlobalOutlined, PlusOutlined, SearchOutlined} from "@ant-design/icons";
import {Button, Form, Input, message, Modal, Select, Space, Switch, Table, theme, Transfer, Typography} from "antd";
import type {ColumnsType} from "antd/es/table";
import type {TransferProps} from "antd/es/transfer";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {
    FileTypeEnum,
    type WebSiteResourceQueryParams,
    type WebSiteResourceResponse,
    type WebSiteResourceTypeEnum,
    type WebSiteUserRequest,
    type WebSiteUserResponse
} from "../models";
import {WebSiteResourceTypeEnum as WebSiteResourceTypeValues} from "../models/WebSiteResourceTypeEnum";
import VirtualList from "rc-virtual-list";
import {webSiteManagementAPI} from "../services";
import {formatDateTime} from "../tools";

const PAGE_SIZE = 100;

type ResourceType = WebSiteResourceTypeEnum;
type FileType = typeof FileTypeEnum[keyof typeof FileTypeEnum];

interface ResourceOption {
    acl_id: number;
    resource_type: string;
    resource_id: number;
    name: string;
    path?: string;
    file_type?: string;
}

interface TransferItem extends ResourceOption {
    key: string;
    title: string;
}

const mapResourceResponseToOption = (resource: WebSiteResourceResponse): ResourceOption => ({
    acl_id: resource.acl_id,
    resource_type: resource.resource_type,
    resource_id: resource.resource_id,
    name: resource.name,
    path: resource.path,
    file_type: resource.file_type
});

const mapUserResourceToOption = (resource: WebSiteResourceResponse): ResourceOption => ({
    acl_id: resource.acl_id,
    resource_type: resource.resource_type,
    resource_id: resource.resource_id,
    name: resource.name ?? `Resource ${resource.resource_id}`
});

const mergeResourceLists = (primary: ResourceOption[], secondary: ResourceOption[] = []): ResourceOption[] => {
    const merged = new Map<number, ResourceOption>();
    primary.forEach((item) => merged.set(item.acl_id, item));
    secondary.forEach((item) => {
        const existing = merged.get(item.acl_id) ?? {};
        merged.set(item.acl_id, {...existing, ...item});
    });
    return Array.from(merged.values());
};

const resourceTypeOptions: ResourceType[] = Object.values(WebSiteResourceTypeValues);

const fileTypeOptions: FileType[] = Object.values(FileTypeEnum);

export function WebSiteUserList() {
    const [users, setUsers] = useState<WebSiteUserResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingUser, setEditingUser] = useState<WebSiteUserResponse | null>(null);
    const [form] = Form.useForm<WebSiteUserRequest>();
    const {token} = theme.useToken();

    const [resourceOptions, setResourceOptions] = useState<ResourceOption[]>([]);
    const [userResourceOptions, setUserResourceOptions] = useState<ResourceOption[]>([]);
    const [selectedAclIds, setSelectedAclIds] = useState<number[]>([]);
    const [originalAclIds, setOriginalAclIds] = useState<number[]>([]);
    const [resourcesLoading, setResourcesLoading] = useState(false);

    const [resourceType, setResourceType] = useState<ResourceType | undefined>();
    const [fileType, setFileType] = useState<FileType | undefined>();
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const previousSelectionCount = useRef(0);

    const resolveUserId = (user: WebSiteUserResponse | null): number | null => {
        if (!user) {
            return null;
        }
        const enriched = user as WebSiteUserResponse & { id?: number; user_id?: number };
        return enriched.id ?? enriched.user_id ?? null;
    };

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await webSiteManagementAPI.getAllWebUsers();
            setUsers(data);
        } catch (err) {
            console.error(err);
            message.error("Failed to load web users");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadUsers();
    }, [loadUsers]);

    const loadResources = useCallback(async (page = 0, append = false) => {
        setResourcesLoading(true);
        try {
            const params: WebSiteResourceQueryParams = {
                page,
                size: PAGE_SIZE
            };
            if (resourceType) {
                params.type = resourceType;
            }
            if (resourceType === WebSiteResourceTypeValues.SITE_FILE && fileType) {
                params.file_type = fileType;
            }
            if (searchQuery.trim().length > 0) {
                params.query = searchQuery.trim();
            }
            const response = await webSiteManagementAPI.getResources(params);
            const mapped = response.items.map(mapResourceResponseToOption);
            setResourceOptions((prev) => (append ? mergeResourceLists(prev, mapped) : mapped));
            setCurrentPage(response.page_number);
            setTotalPages(response.total_pages);
            setTotalElements(response.total_elements);
        } catch (err) {
            console.error(err);
            message.error("Failed to load resources");
        } finally {
            setResourcesLoading(false);
        }
    }, [fileType, resourceType, searchQuery]);

    const loadUserResources = useCallback(async (userId: number) => {
        try {
            const userResources = await webSiteManagementAPI.getResourcesByWebUserId(userId);
            const mapped = userResources.resources.map(mapUserResourceToOption);
            const aclIds = mapped.map((item) => item.acl_id);
            setSelectedAclIds(aclIds);
            setOriginalAclIds(aclIds);
            setUserResourceOptions(mapped);
        } catch (err) {
            console.error(err);
            message.error("Failed to load user resources");
            setSelectedAclIds([]);
            setOriginalAclIds([]);
            setUserResourceOptions([]);
        }
    }, []);

    const openCreateModal = (): void => {
        setEditingUser(null);
        form.setFieldsValue({username: "", password: "", global_permission: false});
        setResourceType(undefined);
        setFileType(undefined);
        setSearchQuery("");
        setSelectedAclIds([]);
        setOriginalAclIds([]);
        setUserResourceOptions([]);
        setModalOpen(true);
        void loadResources(0, false);
    };

    const openEditModal = (user: WebSiteUserResponse): void => {
        setEditingUser(user);
        form.setFieldsValue({username: user.username, password: "", global_permission: user.global_permission ?? false});
        setResourceType(undefined);
        setFileType(undefined);
        setSearchQuery("");
        setSelectedAclIds([]);
        setOriginalAclIds([]);
        setUserResourceOptions([]);
        setModalOpen(true);
        void loadResources(0, false);
        const userId = resolveUserId(user);
        if (userId !== null) {
            void loadUserResources(userId);
        }
    };

    const closeModal = (): void => {
        setModalOpen(false);
        setEditingUser(null);
        form.resetFields();
        setResourceOptions([]);
        setUserResourceOptions([]);
        setSelectedAclIds([]);
        setOriginalAclIds([]);
        setResourceType(undefined);
        setFileType(undefined);
        setSearchQuery("");
        setCurrentPage(0);
        setTotalPages(0);
        setTotalElements(0);
    };

    const handleSearchResources = (): void => {
        setCurrentPage(0);
        void loadResources(0, false);
    };

    const handleLoadMoreResources = (): void => {
        if (currentPage + 1 < totalPages) {
            void loadResources(currentPage + 1, true);
        }
    };

    const describeResource = (item: ResourceOption): string => {
        const descriptors = [item.resource_type, item.name, item.path, item.file_type].filter(Boolean);
        return descriptors.join(" · ");
    };

    const transferDataSource: TransferItem[] = useMemo(() => (
            mergeResourceLists(resourceOptions, userResourceOptions).map((item) => ({
                ...item,
                key: String(item.acl_id),
                title: describeResource(item)
            }))
    ), [resourceOptions, userResourceOptions]);

    const transferTargetKeys = useMemo(() => selectedAclIds.map((id) => String(id)), [selectedAclIds]);

    const handleTransferChange: TransferProps<TransferItem>["onChange"] = (nextTargetKeys) => {
        setSelectedAclIds(nextTargetKeys.map((key) => Number(key)));
    };

    useEffect(() => {
        if (!modalOpen) {
            previousSelectionCount.current = selectedAclIds.length;
            return;
        }
        if (previousSelectionCount.current > 0 && selectedAclIds.length === 0) {
            message.warning("No resources selected for this web user");
        }
        previousSelectionCount.current = selectedAclIds.length;
    }, [modalOpen, selectedAclIds.length]);

    const applyResourceChanges = useCallback(async (userId: number) => {
        const toAdd = selectedAclIds.filter((aclId) => !originalAclIds.includes(aclId));
        const toRemove = originalAclIds.filter((aclId) => !selectedAclIds.includes(aclId));

        if (toAdd.length > 0) {
            try {
                await Promise.all(toAdd.map((aclId) => webSiteManagementAPI.createWebAcl({acl_id: aclId, user_id: userId})));
            } catch (err) {
                console.error(err);
                message.error("Failed to add new resource assignments");
            }
        }

        if (toRemove.length > 0) {
            try {
                const allAcls = await webSiteManagementAPI.getAllWebAcls();
                const deletableAcls = allAcls.filter((acl) => acl.user_id === userId && toRemove.includes(acl.acl_id));
                await Promise.all(deletableAcls.map((acl) => webSiteManagementAPI.deleteWebAcl(acl.id)));
            } catch (err) {
                console.error(err);
                message.error("Failed to remove resource assignments");
            }
        }
    }, [originalAclIds, selectedAclIds]);

    const handleSubmit = async (): Promise<void> => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            let userId: number | null;
            if (editingUser) {
                userId = resolveUserId(editingUser);
                if (userId === null) {
                    message.error("Missing user identifier");
                    return;
                }
                await webSiteManagementAPI.updateWebUser(userId, values);
            } else {
                const createdUser = await webSiteManagementAPI.createWebUser(values);
                userId = resolveUserId(createdUser);
            }

            if (userId === null) {
                message.error("Failed to determine user identifier");
                return;
            }

            await applyResourceChanges(userId);

            if (selectedAclIds.length === 0) {
                message.warning("Web user was saved without any resource access");
            }

            message.success(editingUser ? "Web user updated" : "Web user created");
            closeModal();
            await loadUsers();
        } catch (err) {
            console.error(err);
            message.error("Operation failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (user: WebSiteUserResponse): void => {
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
                    await webSiteManagementAPI.deleteWebUser(userId);
                    message.success("Web user deleted");
                    await loadUsers();
                } catch (error) {
                    console.error(error);
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
            title: "Creator",
            dataIndex: "creator"
        },
        {
            title: "Created",
            dataIndex: "created",
            render: (_, record) => formatDateTime(record.created)
        },
        {
            title: "Modifier",
            dataIndex: "modifier"
        },
        {
            title: "Modified",
            dataIndex: "modified",
            render: (_, record) => (record.modified === null || record.modified === undefined || record.modified.length === 0) ? "-" : formatDateTime(record.modified)
        },
        {
            title: "Global",
            dataIndex: "global_permission",
            align: "center",
            render: (_, record) => record.global_permission ? <GlobalOutlined style={{color: token.colorPrimary}}/> : null
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                    <Space>
                        <Button size="small" onClick={() => openEditModal(record)}><EditOutlined/></Button>
                        <Button size="small" danger onClick={() => handleDelete(record)}><DeleteOutlined/></Button>
                    </Space>
            )
        }
    ], [token]);

    const renderTransferItem = (item: TransferItem) => (
            <span>{item.title}</span>
    );

    return (
            <>
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16}}>
                    <Typography.Title level={3} style={{margin: 0}}>
                        <Space orientation={"horizontal"} size={16}>
                            Web Users
                            <Button type="primary" shape="circle" icon={<PlusOutlined/>} onClick={openCreateModal}/>
                        </Space>
                    </Typography.Title>
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
                        width={"95%"}
                >
                    <Form form={form} layout="vertical" preserve={false} initialValues={{global_permission: false}}>
                        <Form.Item
                                label="Username"
                                name="username"
                                rules={[{required: true, message: "Username is required"}]}
                        >
                            <Input autoFocus/>
                        </Form.Item>
                        <Form.Item
                                label="Password"
                                name="password"
                                rules={editingUser ? [] : [{required: true, message: "Password is required"}]}
                        >
                            <Input.Password placeholder={editingUser ? "Leave blank to keep current password" : ""}/>
                        </Form.Item>
                        <Form.Item
                                label="Global Permission"
                                name="global_permission"
                                valuePropName="checked"
                        >
                            <Switch/>
                        </Form.Item>

                        <Typography.Title level={5}>Resource Access</Typography.Title>
                        <Typography.Paragraph type="secondary" style={{marginTop: 0}}>
                            Filter resources by type, optional site file subtype, or search text and move selected items to the right.
                        </Typography.Paragraph>

                        <Space orientation={"vertical"} style={{width: "100%", marginBottom: 16}}>
                            <Space.Compact style={{width: "100%"}}>
                                <Select<ResourceType | undefined>
                                        placeholder="Resource type"
                                        value={resourceType}
                                        onChange={(value) => setResourceType(value)}
                                        allowClear
                                        style={{width: 200}}
                                        options={resourceTypeOptions.map((value) => ({label: value.replace("_", " "), value}))}
                                />
                                <Select<FileType | undefined>
                                        placeholder="Site file type"
                                        value={fileType}
                                        onChange={(value) => setFileType(value)}
                                        allowClear
                                        style={{width: 200}}
                                        disabled={resourceType !== WebSiteResourceTypeValues.SITE_FILE}
                                        options={fileTypeOptions.map((value) => ({label: value, value}))}
                                />
                                <Input
                                        placeholder="Search resources"
                                        value={searchQuery}
                                        onChange={(event) => setSearchQuery(event.target.value)}
                                        allowClear
                                        onPressEnter={handleSearchResources}
                                />
                                <Button
                                        type="primary"
                                        icon={<SearchOutlined/>}
                                        onClick={handleSearchResources}
                                        loading={resourcesLoading}
                                >
                                    Search
                                </Button>
                            </Space.Compact>
                            <Typography.Text type="secondary">
                                Showing {transferDataSource.length} of {totalElements} resources
                            </Typography.Text>
                        </Space>

                        <Transfer<TransferItem>
                                dataSource={transferDataSource}
                                targetKeys={transferTargetKeys}
                                onChange={handleTransferChange}
                                render={renderTransferItem}
                                showSearch
                                filterOption={(input, item) => item.title.toLowerCase().includes(input.toLowerCase())}
                                style={{width: "100%"}}
                                titles={["Available", "Assigned"]}
                                locale={{itemUnit: "resource", itemsUnit: "resources"}}
                                oneWay={selectedAclIds.length === 0}
                                showSelectAll={true}
                        >
                            {({onItemSelect, selectedKeys, filteredItems}) => (
                                    <VirtualList
                                            data={filteredItems}
                                            height={400}
                                            itemHeight={40}
                                            itemKey="key"
                                    >
                                        {(item) => {
                                            const disabled = false;
                                            const checked = selectedKeys.includes(item.key);
                                            return (
                                                    <div
                                                            key={item.key}
                                                            className="virtual-transfer-item"
                                                            style={{padding: "4px 8px", cursor: disabled ? "not-allowed" : "pointer"}}
                                                            onClick={() => !disabled && onItemSelect(item.key, !checked)}
                                                            onKeyDown={(event) => {
                                                                if (event.key === "Enter" && !disabled) {
                                                                    onItemSelect(item.key, !checked);
                                                                }
                                                            }}
                                                            role="option"
                                                            aria-selected={checked}
                                                    >
                                                        <input
                                                                type="checkbox"
                                                                readOnly
                                                                checked={checked}
                                                                style={{marginRight: 8}}
                                                        />
                                                        {renderTransferItem(item)}
                                                    </div>
                                            );
                                        }}
                                    </VirtualList>
                            )}
                        </Transfer>

                        {currentPage + 1 < totalPages && (
                                <Button style={{marginTop: 12}} onClick={handleLoadMoreResources} loading={resourcesLoading}>
                                    Load more resources (page {currentPage + 2} of {totalPages}, {totalElements} total)
                                </Button>
                        )}

                        <Typography.Text type={selectedAclIds.length === 0 ? "warning" : "secondary"} style={{display: "block", marginTop: 12}}>
                            {selectedAclIds.length} resource{selectedAclIds.length === 1 ? "" : "s"} selected
                        </Typography.Text>
                    </Form>
                </Modal>
            </>
    );
}
