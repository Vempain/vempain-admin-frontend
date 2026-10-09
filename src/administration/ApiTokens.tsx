import {Alert, AutoComplete, Button, DatePicker, Form, Input, message, Modal, Popconfirm, Space, Spin, Table, Tag, Typography} from "antd";
import type {ColumnsType} from "antd/es/table";
import {DeleteOutlined, KeyOutlined, PlusCircleFilled} from "@ant-design/icons";
import {useCallback, useEffect, useState} from "react";
import dayjs, {type Dayjs} from "dayjs";
import {type ApiTokenCreatedResponse, type ApiTokenNetworkResponse, ApiTokenNetworkSource, type ApiTokenRequest, type ApiTokenResponse} from "../models";
import {apiTokenAPI} from "../services";
import {formatDateTime, isValidNetwork} from "../tools";

interface TokenFormValues {
    description: string;
    network: string;
    expires_at: Dayjs;
}

function networkHint(suggestion: ApiTokenNetworkResponse | null): string {
    switch (suggestion?.source) {
        case ApiTokenNetworkSource.PRIVATE_NETWORK:
            return "Pre-filled with the private network the admin backend shares with the other services; pick another one from the list if "
                    + "the file backend reaches this service over a different network.";
        case ApiTokenNetworkSource.CONFIGURED:
            return "Pre-filled from the configured default network (vempain.admin.api-token.default-network).";
        default:
            return "A single address is a /32 (IPv4) or /128 (IPv6) network. Enter the network the file backend calls from; behind a proxy that "
                    + "is its real source network, not the proxy's.";
    }
}

/**
 * Management of the service-to-service API tokens other services (the file backend) use instead of logging in. A token is shown
 * exactly once, right after it is created; afterwards only its prefix identifies it. Deleting a token revokes it immediately.
 */
export function ApiTokens() {
    const [tokens, setTokens] = useState<ApiTokenResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [creating, setCreating] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [created, setCreated] = useState<ApiTokenCreatedResponse | null>(null);
    const [suggestion, setSuggestion] = useState<ApiTokenNetworkResponse | null>(null);
    const [form] = Form.useForm<TokenFormValues>();

    const load = useCallback(() => {
        setLoading(true);
        apiTokenAPI.list()
                .then(setTokens)
                .catch(error => {
                    console.error("Failed to load API tokens:", error);
                    message.error("Failed to load the API tokens");
                })
                .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    /** Opens the creation modal pre-filled with the network the backend proposes (its private network, when the deployment declares one) */
    function openCreate() {
        setCreating(true);
        apiTokenAPI.defaultNetwork()
                .then(response => {
                    setSuggestion(response);
                    form.setFieldsValue({network: response.network ?? ""});
                })
                .catch(error => {
                    console.error("Failed to fetch the default token network:", error);
                    setSuggestion(null);
                });
    }

    function submit(values: TokenFormValues) {
        const request: ApiTokenRequest = {
            description: values.description.trim(),
            network: values.network.trim(),
            expires_at: values.expires_at.toISOString()
        };
        setSubmitting(true);
        apiTokenAPI.createToken(request)
                .then(response => {
                    setCreated(response);
                    setCreating(false);
                    form.resetFields();
                    load();
                })
                .catch(error => {
                    console.error("Failed to create API token:", error);
                    message.error("Failed to create the API token");
                })
                .finally(() => setSubmitting(false));
    }

    function remove(token: ApiTokenResponse) {
        apiTokenAPI.deleteToken(token.id)
                .then(() => {
                    message.success(`API token ${token.token_prefix} deleted`);
                    load();
                })
                .catch(error => {
                    console.error("Failed to delete API token:", error);
                    message.error("Failed to delete the API token");
                });
    }

    const columns: ColumnsType<ApiTokenResponse> = [
        {title: "Token", dataIndex: "token_prefix", key: "token_prefix", render: (prefix: string) => <code>{prefix}…</code>},
        {title: "Description", dataIndex: "description", key: "description"},
        {title: "Network", dataIndex: "network", key: "network", render: (network: string) => <code>{network}</code>},
        {
            title: "Expires", dataIndex: "expires_at", key: "expires_at",
            render: (value: string, record: ApiTokenResponse) => (
                    <Space>
                        {formatDateTime(dayjs(value))}
                        {record.expired && <Tag color="red">expired</Tag>}
                    </Space>
            )
        },
        {title: "Owner", dataIndex: "owner_user_id", key: "owner_user_id", render: (id: number) => `#${id}`},
        {title: "Created", dataIndex: "created", key: "created", render: (value: string) => formatDateTime(dayjs(value))},
        {title: "Last used", dataIndex: "last_used", key: "last_used", render: (value: string | null) => value ? formatDateTime(dayjs(value)) : "never"},
        {
            title: "Actions", key: "actions",
            render: (_value: unknown, record: ApiTokenResponse) => (
                    <Popconfirm title="Delete this API token?" description="The service using it stops working immediately."
                                okText="Delete" cancelText="Cancel" onConfirm={() => remove(record)}>
                        <Button danger icon={<DeleteOutlined/>} aria-label={`Delete token ${record.token_prefix}`}/>
                    </Popconfirm>
            )
        }
    ];

    return (
            <div className={"DarkDiv"}>
                <Space style={{justifyContent: "space-between", width: "100%"}}>
                    <h1><KeyOutlined/> API tokens</h1>
                    <Button type="primary" icon={<PlusCircleFilled/>} onClick={openCreate}>Create token</Button>
                </Space>
                <Typography.Paragraph type="secondary">
                    Service-to-service tokens other Vempain services present in the X-Vempain-Api-Token header. Each token acts as the
                    administrator who created it, works only from its network until it expires and can only call the service endpoints.
                </Typography.Paragraph>
                <Spin spinning={loading}>
                    <Table dataSource={tokens} columns={columns} rowKey="id" pagination={false} scroll={{x: "max-content"}}/>
                </Spin>

                <Modal open={creating} title="Create API token" onOk={() => form.submit()} onCancel={() => setCreating(false)}
                       confirmLoading={submitting} okText="Create" destroyOnHidden>
                    <Form form={form} layout="vertical" onFinish={submit} initialValues={{expires_at: dayjs().add(1, "year")}}>
                        <Form.Item name="description" label="Description" rules={[{required: true, whitespace: true, max: 255}]}>
                            <Input placeholder="vempain-file-backend production"/>
                        </Form.Item>
                        <Form.Item name="network" label="Allowed network (IPv4 or IPv6, CIDR or single address)"
                                   extra={networkHint(suggestion)}
                                   rules={[{required: true, whitespace: true}, {
                                       validator: (_rule, value) => isValidNetwork(value)
                                               ? Promise.resolve()
                                               : Promise.reject(new Error("Enter an IPv4/IPv6 address or CIDR network"))
                                   }]}>
                            <AutoComplete placeholder="10.0.0.0/24 or 2001:db8::/32"
                                          options={(suggestion?.candidates ?? []).map(candidate => ({
                                              value: candidate.network,
                                              label: `${candidate.network} (${candidate.interface_name}, admin backend at ${candidate.address})`
                                          }))}/>
                        </Form.Item>
                        <Form.Item name="expires_at" label="Expires at"
                                   rules={[{required: true}, {
                                       validator: (_rule, value: Dayjs | undefined) => value && value.isAfter(dayjs())
                                               ? Promise.resolve()
                                               : Promise.reject(new Error("The expiration must be in the future"))
                                   }]}>
                            <DatePicker showTime style={{width: "100%"}} disabledDate={date => date.isBefore(dayjs(), "day")}/>
                        </Form.Item>
                    </Form>
                </Modal>

                <Modal open={created !== null} title="API token created" onOk={() => setCreated(null)} onCancel={() => setCreated(null)}
                       cancelButtonProps={{style: {display: "none"}}} okText="I have stored the token" destroyOnHidden>
                    {created !== null && (
                            <Space direction="vertical" style={{width: "100%"}}>
                                <Alert type="warning" showIcon title="Copy the token now; it is shown only once and can not be retrieved later."/>
                                <Typography.Paragraph copyable={{text: created.token}} code data-testid="created-token">{created.token}</Typography.Paragraph>
                                <Typography.Text type="secondary">
                                    Configure it as ENV_VEMPAIN_ADMIN_BACKEND_API_TOKEN of the calling service ({created.api_token.description},
                                    network {created.api_token.network}, expires {formatDateTime(dayjs(created.api_token.expires_at))}).
                                </Typography.Text>
                            </Space>
                    )}
                </Modal>
            </div>
    );
}
