import {Button, Empty, message, Space, Table, Tag, Typography} from "antd";
import type {ColumnsType} from "antd/es/table";
import {useCallback, useEffect, useMemo, useState} from "react";
import type {DataSummaryResponse} from "../models";
import {dataAPI} from "../services";
import {formatDateTime} from "../tools";

const MUSIC_KEYWORDS = ["music", "album", "song", "cd", "audio"] as const;
const GPS_KEYWORDS = ["gps", "geo", "track", "location"] as const;

const normalize = (value: string | null | undefined): string => (value ?? "").trim().toLowerCase();

const buildSearchText = (item: DataSummaryResponse): string => {
    return [item.identifier, item.type, item.description].map(normalize).join(" ");
};

const includesAnyKeyword = (text: string, keywords: readonly string[]): boolean => {
    return keywords.some((keyword) => text.includes(keyword));
};

export function WebSiteDataPublish() {
    const [dataSets, setDataSets] = useState<DataSummaryResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [publishingIdentifier, setPublishingIdentifier] = useState<string | null>(null);

    const loadDataSets = useCallback(async () => {
        setLoading(true);
        try {
            const items = await dataAPI.getAllDataSets();
            setDataSets(items);
        } catch (error) {
            console.error(error);
            message.error("Failed to load data sets");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadDataSets();
    }, [loadDataSets]);

    const musicDataSets = useMemo(() => {
        return dataSets.filter((item) => includesAnyKeyword(buildSearchText(item), MUSIC_KEYWORDS));
    }, [dataSets]);

    const gpsTimeSeriesDataSets = useMemo(() => {
        return dataSets.filter((item) => {
            if (normalize(item.type) !== "time_series") {
                return false;
            }
            return includesAnyKeyword(buildSearchText(item), GPS_KEYWORDS);
        });
    }, [dataSets]);

    const handlePublish = useCallback(async (identifier: string) => {
        setPublishingIdentifier(identifier);
        try {
            await dataAPI.publishDataSet(identifier);
            message.success(`Published data set '${identifier}' to website`);
            await loadDataSets();
        } catch (error) {
            console.error(error);
            message.error(`Failed to publish data set '${identifier}'`);
        } finally {
            setPublishingIdentifier(null);
        }
    }, [loadDataSets]);

    const columns: ColumnsType<DataSummaryResponse> = useMemo(() => [
        {
            title: "Identifier",
            dataIndex: "identifier",
            key: "identifier"
        },
        {
            title: "Type",
            dataIndex: "type",
            key: "type",
            render: (_, record) => <Tag>{record.type}</Tag>
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            render: (_, record) => record.description ?? "-"
        },
        {
            title: "Generated",
            dataIndex: "generated",
            key: "generated",
            render: (_, record) => formatDateTime(record.generated)
        },
        {
            title: "Actions",
            key: "actions",
            width: 180,
            render: (_, record) => (
                    <Button
                            type="primary"
                            onClick={() => void handlePublish(record.identifier)}
                            loading={publishingIdentifier === record.identifier}
                    >
                        Release to website
                    </Button>
            )
        }
    ], [handlePublish, publishingIdentifier]);

    const renderDataSetSection = (title: string, items: DataSummaryResponse[], emptyDescription: string) => (
            <div style={{marginTop: 24}}>
                <Typography.Title level={4}>{title}</Typography.Title>
                {items.length === 0 ? (
                        <Empty description={emptyDescription} image={Empty.PRESENTED_IMAGE_SIMPLE}/>
                ) : (
                        <Table<DataSummaryResponse>
                                rowKey={(record) => record.identifier}
                                columns={columns}
                                dataSource={items}
                                loading={loading}
                                pagination={false}
                                size="small"
                        />
                )}
            </div>
    );

    return (
            <div>
                <Typography.Title level={3}>Website data publishing</Typography.Title>
                <Space direction="vertical" size={6}>
                    <Typography.Text>
                        Music data available for publishing: {musicDataSets.length > 0 ? "Yes" : "No"}
                    </Typography.Text>
                    <Typography.Text type="secondary">
                        Total matching music data sets: {musicDataSets.length}
                    </Typography.Text>
                </Space>

                {renderDataSetSection(
                        "Music data",
                        musicDataSets,
                        "No publishable music data sets found"
                )}

                {renderDataSetSection(
                        "GPS time series",
                        gpsTimeSeriesDataSets,
                        "No GPS time series data sets found"
                )}
            </div>
    );
}

