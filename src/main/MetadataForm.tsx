import { Col, Divider, Row } from "antd";
import React from "react";
import dayjs from "dayjs";

interface Metadata {
    creator: number;
    created: Date;
    modifier?: number | null;
    modified?: Date | null;
}

interface MetadataFormProps {
    metadata: Metadata;
}

function MetadataForm({metadata}: MetadataFormProps) {
    const formatDate = (date: Date | null | undefined) => {
        return date ? dayjs(date).format("YYYY-MM-DD HH:mm") : "-";
    };

    return (
            <div>
                <Divider orientation={"left"} key={"page-meta-divider"}>Metadata</Divider>
                <div>
                    <Row gutter={[16, 16]}>
                        <Col span={6}><b>Creator</b></Col>
                        <Col span={6}><b>Created</b></Col>
                        <Col span={6}><b>Modifier</b></Col>
                        <Col span={6}><b>Modified</b></Col>
                    </Row>
                    <Row gutter={[16, 16]}>
                        <Col span={6}>{metadata.creator}</Col>
                        <Col span={6}>{formatDate(metadata.created)}</Col>
                        <Col span={6}>{metadata.modifier ?? "-"}</Col>
                        <Col span={6}>{formatDate(metadata.modified)}</Col>
                    </Row>
                </div>
            </div>
    );
}

export { MetadataForm };