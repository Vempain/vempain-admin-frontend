import CommonFileVO from "../models/Responses/Files/CommonFileVO";
import { Card, Collapse, Descriptions, Input } from "antd";
import { formatDateTime, formatFileSize } from "../tools";

interface CommonFileCardProps {
    commonFile: CommonFileVO;
}

export function CommonFileCard({commonFile}: CommonFileCardProps) {
    const metaData = JSON.parse(commonFile.metadata)[0];

    // Generate Collapse items dynamically
    const metadataProps = Object.keys(metaData).map(key => ({
        label: key,
        items: typeof metaData[key] === "string" ? (
                // Render directly if value is a string
                <Input value={metaData[key]}/>
        ) : (
                // Otherwise, render Descriptions for sub-properties
                <Descriptions bordered column={1}>
                    {/* Iterate over the sub-properties of each main section */}
                    {Object.entries(metaData[key]).map(([subKey, value]) => (
                            <Descriptions.Item label={subKey} key={subKey}>
                                {value as string}
                            </Descriptions.Item>
                    ))}
                </Descriptions>
        )
    }));

    return (
            <Card>
                <Descriptions bordered>
                    <Descriptions.Item label="ID">{commonFile.id}</Descriptions.Item>
                    <Descriptions.Item label="Comment">{commonFile.comment}</Descriptions.Item>
                    <Descriptions.Item label="Original Datetime">{formatDateTime(commonFile.original_date_time)}</Descriptions.Item>
                    <Descriptions.Item label="Converted File">{commonFile.converted_file}</Descriptions.Item>
                    <Descriptions.Item label="Converted Size">{formatFileSize(commonFile.converted_filesize)}</Descriptions.Item>
                    <Descriptions.Item label="Converted SHA1Sum">{commonFile.converted_sha1sum}</Descriptions.Item>
                    <Descriptions.Item label="Site File">{commonFile.site_filename}</Descriptions.Item>
                    <Descriptions.Item label="Site Path">{commonFile.site_filepath}</Descriptions.Item>
                    <Descriptions.Item label="Site Size">{formatFileSize(commonFile.site_filesize)}</Descriptions.Item>
                    <Descriptions.Item label="Site SHA1Sum">{commonFile.site_sha1sum}</Descriptions.Item>
                </Descriptions>
                <Collapse accordion>
                    <Collapse.Panel header="Metadata" key="metadata">
                        <Collapse accordion items={metadataProps}/>
                    </Collapse.Panel>
                </Collapse>
            </Card>
    );
}