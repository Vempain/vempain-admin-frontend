import {Descriptions, Tooltip, Typography} from "antd";
import {useEffect, useState} from "react";
import dayjs, {type Dayjs} from "dayjs";
import {resolveUserName} from "../tools/userNames";

interface Metadata {
    creator: number;
    created: Dayjs | string;
    modifier?: number | null;
    modified?: Dayjs | string | null;
}

interface MetadataFormProps {
    metadata: Metadata;
}

const EMPTY = "–";

function formatStamp(value: Dayjs | string | null | undefined): { short: string; full: string } | null {
    if (value === null || value === undefined) {
        return null;
    }
    const stamp = dayjs(value);
    if (!stamp.isValid()) {
        return null;
    }
    return {short: stamp.format("YYYY-MM-DD HH:mm"), full: stamp.format("YYYY-MM-DD HH:mm:ss")};
}

function UserName({id}: { id: number | null | undefined }) {
    const [name, setName] = useState<string | null>(null);

    useEffect(() => {
        if (id === null || id === undefined || id <= 0) {
            return;
        }
        let active = true;
        resolveUserName(id)
                .then(resolved => {
                    if (active) setName(resolved);
                });
        return () => {
            active = false;
        };
    }, [id]);

    if (id === null || id === undefined || id <= 0) {
        return <Typography.Text type="secondary">{EMPTY}</Typography.Text>;
    }
    return (
            <Tooltip title={`User ID ${id}`}>
                <Typography.Text>{name ?? `#${id}`}</Typography.Text>
            </Tooltip>
    );
}

function Stamp({value}: { value: Dayjs | string | null | undefined }) {
    const formatted = formatStamp(value);
    if (formatted === null) {
        return <Typography.Text type="secondary">{EMPTY}</Typography.Text>;
    }
    return (
            <Tooltip title={formatted.full}>
                <Typography.Text>{formatted.short}</Typography.Text>
            </Tooltip>
    );
}

/**
 * Read-only audit trail of an entity (who created and last modified it, and when) as one compact line of descriptions. The user ids
 * are shown as "name (login)" once resolved; hovering shows the raw id and the exact timestamp.
 */
function MetadataForm({metadata}: MetadataFormProps) {
    return (
            <Descriptions
                    size="small"
                    column={{xs: 1, sm: 2, lg: 4}}
                    colon={false}
                    styles={{label: {color: "rgba(128, 128, 128, 0.9)", fontSize: "0.85em", paddingInlineEnd: 6}}}
                    data-testid="metadata"
                    items={[
                        {key: "creator", label: "Created by", children: <UserName id={metadata.creator}/>},
                        {key: "created", label: "Created", children: <Stamp value={metadata.created}/>},
                        {key: "modifier", label: "Modified by", children: <UserName id={metadata.modifier}/>},
                        {key: "modified", label: "Modified", children: <Stamp value={metadata.modified}/>}
                    ]}
            />
    );
}

export {MetadataForm};
