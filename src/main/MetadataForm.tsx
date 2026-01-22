import {Col, Divider, Row} from "antd";
import dayjs, {type Dayjs} from "dayjs";

interface Metadata {
    creator: number;
    created: Dayjs;
    modifier?: number | null;
    modified?: Dayjs | null;
}

interface MetadataFormProps {
    metadata: Metadata;
}

function MetadataForm({metadata}: MetadataFormProps) {
    const displayCreated = dayjs(metadata.created).format("YYYY-MM-DD hh:mm");
    const displayModified = metadata.modified ? dayjs(metadata.modified).format("YYYY-MM-DD hh:mm") : "-";
    return (
            <div style={{backgroundColor: "rgba(190, 190, 190, 0.1)", padding: "16px", borderRadius: "4px"}}>
                <Divider orientation={"horizontal"} key={"page-meta-divider"}>Metadata</Divider>
                <div>
                    <Row gutter={[16, 16]}>
                        <Col span={6}><b>Creator</b></Col>
                        <Col span={6}><b>Created</b></Col>
                        <Col span={6}><b>Modifier</b></Col>
                        <Col span={6}><b>Modified</b></Col>
                    </Row>
                    <Row gutter={[16, 16]}>
                        <Col span={6}>{metadata.creator}</Col>
                        <Col span={6}>{displayCreated}</Col>
                        <Col span={6}>{metadata.modifier ?? "-"}</Col>
                        <Col span={6}>{displayModified}</Col>
                    </Row>
                </div>
            </div>
    );
}

export {MetadataForm};