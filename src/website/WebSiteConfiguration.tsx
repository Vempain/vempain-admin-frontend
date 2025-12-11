import {Button, Input, InputNumber, message, Space, Switch, Table, Typography} from "antd";
import type {ColumnsType} from "antd/es/table";
import {useCallback, useEffect, useMemo, useState} from "react";
import {type WebSiteConfigurationRequest, type WebSiteConfigurationResponse, WebSiteConfigurationTypeEnum} from "../models";
import {webSiteManagementAPI} from "../services";

const parseConfigValue = (config: WebSiteConfigurationResponse) => {
    const raw = config.config_value ?? "";
    switch (config.config_type) {
        case WebSiteConfigurationTypeEnum.NUMBER:
            return raw === "" ? undefined : Number(raw);
        case WebSiteConfigurationTypeEnum.BOOLEAN:
            return raw.toLowerCase() === "true";
        default:
            return raw;
    }
};

const serializeConfigValue = (value: string | number | boolean | undefined, type: WebSiteConfigurationTypeEnum) => {
    if (type === WebSiteConfigurationTypeEnum.BOOLEAN) {
        return value === true || String(value).toLowerCase() === "true" ? "true" : "false";
    }

    if (value === null || value === undefined) {
        return "";
    }

    return String(value);
};

const isValueDirty = (config: WebSiteConfigurationResponse, valueMap: Record<string, string | number | boolean | undefined>) => {
    const stored = valueMap.hasOwnProperty(config.id) ? valueMap[config.id] : parseConfigValue(config);
    const original = parseConfigValue(config);
    return stored !== original;
};

export function WebSiteConfiguration() {
    const [configs, setConfigs] = useState<WebSiteConfigurationResponse[]>([]);
    const [values, setValues] = useState<Record<string, string | number | boolean | undefined>>({});
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<Record<string, boolean>>({});

    const loadConfigurations = useCallback(async () => {
        setLoading(true);
        try {
            const data = await webSiteManagementAPI.getAllConfigurations();
            setConfigs(data);
            setValues(data.reduce((acc, config) => {
                acc[config.id] = parseConfigValue(config);
                return acc;
            }, {} as Record<string, string | number | boolean | undefined>));
        } catch (error) {
            console.error(error);
            message.error("Failed to load configuration data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadConfigurations();
    }, [loadConfigurations]);

    const handleValueChange = useCallback((id: string, next: string | number | boolean | undefined) => {
        setValues((prev) => ({...prev, [id]: next}));
    }, []);

    const handleUpdate = useCallback(async (config: WebSiteConfigurationResponse) => {
        setUpdating((prev) => ({...prev, [config.id]: true}));
        try {
            const request: WebSiteConfigurationRequest = {
                ...config,
                config_value: serializeConfigValue(values[config.id], config.config_type)
            };
            const updated = await webSiteManagementAPI.updateConfiguration(request);
            setConfigs((prev) => prev.map((item) => item.id === updated.id ? updated : item));
            setValues((prev) => ({...prev, [updated.id]: parseConfigValue(updated)}));
            message.success(`Configuration "${updated.config_key}" updated`);
        } catch (error) {
            console.error(error);
            message.error("Failed to update configuration");
        } finally {
            setUpdating((prev) => ({...prev, [config.id]: false}));
        }
    }, [values]);

    const columns: ColumnsType<WebSiteConfigurationResponse> = useMemo(() => [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            width: 120
        },
        {
            title: "Key",
            dataIndex: "config_key",
            key: "config_key",
            width: 220
        },
        {
            title: "Type",
            dataIndex: "config_type",
            key: "config_type",
            width: 140
        },
        {
            title: "Default",
            dataIndex: "config_default",
            key: "config_default",
            render: (value: string) => <Typography.Text type="secondary">{value || "—"}</Typography.Text>
        },
        {
            title: "Value",
            dataIndex: "config_value",
            key: "config_value",
            render: (_, config) => {
                const currentValue = values.hasOwnProperty(config.id) ? values[config.id] : parseConfigValue(config);
                switch (config.config_type) {
                    case WebSiteConfigurationTypeEnum.NUMBER: {
                        const numberValue: number = typeof currentValue === "number" ? currentValue : (currentValue ? Number(currentValue) : 0);
                        return (
                                <InputNumber
                                        style={{width: 180}}
                                        value={numberValue}
                                        onChange={(value) => handleValueChange(config.id, value ?? undefined)}
                                        controls={false}
                                />
                        );
                    }
                    case WebSiteConfigurationTypeEnum.BOOLEAN:
                        return (
                                <Switch
                                        checked={Boolean(currentValue)}
                                        onChange={(checked) => handleValueChange(config.id, checked)}
                                />
                        );
                    default:
                        return (
                                <Input
                                        value={typeof currentValue === "string" ? currentValue : String(currentValue ?? "")}
                                        onChange={(event) => handleValueChange(config.id, event.target.value)}
                                />
                        );
                }
            }
        },
        {
            title: "Actions",
            key: "actions",
            width: 160,
            render: (_, config) => {
                const dirty = isValueDirty(config, values);
                const isUpdating = Boolean(updating[config.id]);
                return (
                        <Space>
                            <Button
                                    type="primary"
                                    size="small"
                                    disabled={!dirty || isUpdating}
                                    loading={isUpdating}
                                    onClick={() => void handleUpdate(config)}
                            >
                                Update
                            </Button>
                        </Space>
                );
            }
        }
    ], [handleUpdate, handleValueChange, updating, values]);

    return (
            <div>
                <Typography.Title level={3}>Web site configuration</Typography.Title>
                <Table
                        rowKey={(record) => record.id}
                        loading={loading}
                        columns={columns}
                        dataSource={configs}
                        pagination={false}
                        size="small"
                />
            </div>
    );
}
