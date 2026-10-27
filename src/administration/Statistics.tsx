import {Column, Line} from "@ant-design/charts";
import {Card, Col, message, Progress, Row, Space, Spin, Statistic, Table, Typography} from "antd";
import type {ColumnsType} from "antd/es/table";
import {useCallback, useEffect, useMemo, useState} from "react";
import type {AdminStatisticsResponse, StatisticsCount, StatisticsPublishState} from "../models";
import {statisticsAPI} from "../services";
import {formatDateTime, resourceTypeLabel, stickyTableHeader} from "../tools";

const {Title, Paragraph} = Typography;

interface UserRow {
    key: number;
    user: string;
    total: number;
    byType: { key: string; resource_type: string; count: number }[];
}

const CHART_COLORS = ["#50b0ff", "#ff8a65", "#ffd166", "#7bd389", "#c77dff", "#f78fb3", "#4dd0e1", "#ffb703"];
const CHART_AXIS = {
    x: {labelFill: "#f0f0f0", tickStroke: "#a8a8a8", lineStroke: "#a8a8a8"},
    y: {labelFill: "#f0f0f0", tickStroke: "#a8a8a8", lineStroke: "#a8a8a8"},
};

function countColumns(nameTitle: string, countTitle: string = "Count"): ColumnsType<StatisticsCount> {
    return [
        {title: nameTitle, dataIndex: "name", key: "name", sorter: (a, b) => a.name.localeCompare(b.name)},
        {title: countTitle, dataIndex: "count", key: "count", sorter: (a, b) => a.count - b.count, defaultSortOrder: "descend", width: 120},
    ];
}

function CountTable({rows, nameTitle, countTitle, paged = false}: { rows: StatisticsCount[]; nameTitle: string; countTitle?: string; paged?: boolean }) {
    return <Table<StatisticsCount>
            columns={countColumns(nameTitle, countTitle)}
            dataSource={rows.map(row => ({...row, key: row.name}))}
            pagination={paged ? {defaultPageSize: 15, showSizeChanger: true, hideOnSinglePage: true} : false}
            size="small"
            sticky={stickyTableHeader}
    />;
}

/**
 * Counts of the resources managed by the admin backend with their breakdowns by file type, publish state, month, user, form, layout, component and
 * path. The numbers are system wide, like the inventory metrics; they are read once when the screen opens.
 */
export function Statistics() {
    const [statistics, setStatistics] = useState<AdminStatisticsResponse | null>(null);
    const [loading, setLoading] = useState(true);

    const loadStatistics = useCallback(() => {
        setLoading(true);
        statisticsAPI.getStatistics()
                .then(setStatistics)
                .catch(() => message.error("Failed to load the statistics"))
                .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        loadStatistics();
    }, [loadStatistics]);

    const publishStateRows = useMemo(() => (statistics?.publish_states ?? []).map(state => ({...state, key: state.resource_type})), [statistics]);
    const publishChartData = useMemo(() => (statistics?.publish_states ?? []).flatMap(state => [
        {resource: resourceTypeLabel(state.resource_type), state: "Published", count: state.published},
        {resource: resourceTypeLabel(state.resource_type), state: "Not published", count: state.not_published},
    ]), [statistics]);
    const createdChartData = useMemo(() => (statistics?.created_by_month ?? []).map(entry => ({
        month: entry.month, resource: resourceTypeLabel(entry.resource_type), count: entry.count
    })), [statistics]);
    const publishedChartData = useMemo(() => (statistics?.published_by_month ?? []).map(entry => ({
        month: entry.month, resource: resourceTypeLabel(entry.resource_type), count: entry.count
    })), [statistics]);
    const fileTypeChartData = useMemo(() => (statistics?.files_by_type ?? []).map(entry => ({type: entry.name, files: entry.count})), [statistics]);

    const userRows = useMemo<UserRow[]>(() => {
        const byUser = new Map<number, UserRow>();
        for (const entry of statistics?.resources_by_user ?? []) {
            const row = byUser.get(entry.user_id) ?? {
                key: entry.user_id,
                user: entry.nick ?? `user #${entry.user_id}`,
                total: 0,
                byType: [],
            };
            row.total += entry.count;
            row.byType.push({key: entry.resource_type, resource_type: entry.resource_type, count: entry.count});
            byUser.set(entry.user_id, row);
        }
        return [...byUser.values()].sort((a, b) => b.total - a.total || a.user.localeCompare(b.user));
    }, [statistics]);

    const publishColumns: ColumnsType<StatisticsPublishState> = [
        {title: "Resource", dataIndex: "resource_type", key: "resource_type", render: resourceTypeLabel},
        {title: "Published", dataIndex: "published", key: "published", width: 120},
        {title: "Not published", dataIndex: "not_published", key: "not_published", width: 140},
        {
            title: "Published share",
            key: "share",
            render: (_value, state) => {
                const total = state.published + state.not_published;
                return <Progress percent={total === 0 ? 0 : Math.round(100 * state.published / total)} size="small"
                                 format={percent => `${percent}%`}/>;
            },
        },
    ];

    const userColumns: ColumnsType<UserRow> = [
        {title: "User", dataIndex: "user", key: "user", sorter: (a, b) => a.user.localeCompare(b.user)},
        {title: "Resources", dataIndex: "total", key: "total", sorter: (a, b) => a.total - b.total, defaultSortOrder: "descend", width: 140},
    ];

    return (
            <Spin spinning={loading}>
                <Space orientation="vertical" size="large" style={{width: "95%", padding: 24}}>
                    <div>
                        <Title level={2}>Statistics</Title>
                        <Paragraph>Counts of the resources in Vempain Admin: pages, galleries, site files, components, forms and layouts, with their
                            breakdowns. The counts cover the whole database regardless of access rights.</Paragraph>
                        {statistics && <Paragraph type="secondary">Counted {formatDateTime(statistics.generated_at)}</Paragraph>}
                    </div>
                    {statistics && <>
                        <Card title="Overview" data-testid="statistics-overview">
                            <Row gutter={[16, 16]}>
                                {statistics.resource_counts.map(entry => (
                                        <Col xs={12} sm={8} lg={4} key={entry.name}>
                                            <Statistic title={resourceTypeLabel(entry.name)} value={entry.count}/>
                                        </Col>
                                ))}
                            </Row>
                        </Card>
                        <Card title="Site files by type">
                            <Column data={fileTypeChartData} xField="type" yField="files" colorField="type" scale={{color: {range: CHART_COLORS}}}
                                    theme="classicDark" axis={CHART_AXIS} height={260}/>
                            <CountTable rows={statistics.files_by_type} nameTitle="File type" countTitle="Files"/>
                        </Card>
                        <Card title="Published and not published">
                            <Column data={publishChartData} xField="resource" yField="count" colorField="state" stack={true}
                                    scale={{color: {range: CHART_COLORS}}} theme="classicDark" axis={CHART_AXIS} height={260}/>
                            <Table<StatisticsPublishState> columns={publishColumns} dataSource={publishStateRows} pagination={false} size="small"
                                                           sticky={stickyTableHeader}/>
                        </Card>
                        <Card title="Created per month">
                            <Paragraph type="secondary">Resources created in each calendar month, by resource type.</Paragraph>
                            <Line data={createdChartData} xField="month" yField="count" colorField="resource" scale={{color: {range: CHART_COLORS}}}
                                  theme="classicDark" axis={CHART_AXIS} height={280}/>
                        </Card>
                        <Card title="Published per month">
                            <Paragraph type="secondary">Pages, galleries and site files published in each calendar month; a resource counts in the
                                month of its latest publication.</Paragraph>
                            <Line data={publishedChartData} xField="month" yField="count" colorField="resource" scale={{color: {range: CHART_COLORS}}}
                                  theme="classicDark" axis={CHART_AXIS} height={280}/>
                        </Card>
                        <Card title="Resources by user">
                            <Paragraph type="secondary">Resources by the user who created them; expand a user for the breakdown by resource type.</Paragraph>
                            <Table<UserRow>
                                    columns={userColumns}
                                    dataSource={userRows}
                                    pagination={false}
                                    size="small"
                                    sticky={stickyTableHeader}
                                    expandable={{
                                        expandedRowRender: row => (
                                                <Table
                                                        columns={[
                                                            {
                                                                title: "Resource type",
                                                                dataIndex: "resource_type",
                                                                key: "resource_type",
                                                                render: resourceTypeLabel
                                                            },
                                                            {title: "Count", dataIndex: "count", key: "count", width: 120},
                                                        ]}
                                                        dataSource={row.byType}
                                                        pagination={false}
                                                        size="small"
                                                />
                                        ),
                                    }}
                            />
                        </Card>
                        <Card title="Forms, layouts and components">
                            <Row gutter={[16, 16]}>
                                <Col xs={24} lg={8}>
                                    <Title level={5}>Pages by form</Title>
                                    <CountTable rows={statistics.pages_by_form} nameTitle="Form" countTitle="Pages"/>
                                </Col>
                                <Col xs={24} lg={8}>
                                    <Title level={5}>Forms by layout</Title>
                                    <CountTable rows={statistics.forms_by_layout} nameTitle="Layout" countTitle="Forms"/>
                                </Col>
                                <Col xs={24} lg={8}>
                                    <Title level={5}>Forms by component</Title>
                                    <CountTable rows={statistics.forms_by_component} nameTitle="Component" countTitle="Forms"/>
                                </Col>
                            </Row>
                        </Card>
                        <Card title="Pages by path">
                            <Paragraph type="secondary">Pages grouped by the parent path of their page path.</Paragraph>
                            <CountTable rows={statistics.pages_by_path} nameTitle="Path" countTitle="Pages" paged={true}/>
                        </Card>
                        <Card title="Site files by path">
                            <CountTable rows={statistics.files_by_path} nameTitle="Path" countTitle="Files" paged={true}/>
                        </Card>
                    </>}
                </Space>
            </Spin>
    );
}
