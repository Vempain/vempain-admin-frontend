import {Card, Collapse, Descriptions, Input, Tag} from "antd";
import type {SiteFileResponse} from "../models";
import {formatDateTimeWithMs, formatFileSize} from "../tools";

interface SiteFileCardProps {
  siteFile: SiteFileResponse & Record<string, any>;
}

function isDateKey(key: string) {
  const k = key.toLowerCase();
  return k === "created" || k === "modified" || k.endsWith("date") || k.endsWith("datetime") || k.endsWith("time");
}

function isSizeKey(key: string) {
  const k = key.toLowerCase();
  return k === "size" || k.endsWith("size") || k.endsWith("_filesize");
}

function renderValue(key: string, value: any) {
  if (value == null) return "";
  if (key === "file_class") return <Tag>{String(value)}</Tag>;
  if (isSizeKey(key) && typeof value === "number") return formatFileSize(value);
  if (isDateKey(key) && typeof value === "string") return formatDateTimeWithMs(value);
  if (typeof value === "object") return <pre style={{ margin: 0 }}>{JSON.stringify(value, null, 2)}</pre>;
  return String(value);
}

export function SiteFileCard({ siteFile }: SiteFileCardProps) {
  // Separate metadata (if any) from top-level fields
  const { metadata, ...rest } = siteFile;

  const descriptionItems = Object.entries(rest).map(([key, value]) => (
    <Descriptions.Item key={key} label={key}>
      {renderValue(key, value)}
    </Descriptions.Item>
  ));

  // Build metadata collapse content similar to CommonFileCard
  let metadataItems: { key: string; label: string; children: React.ReactNode }[] | undefined;

  if (metadata !== undefined) {
    let metaObj: any;
    try {
      metaObj = typeof metadata === "string" ? JSON.parse(metadata) : metadata;
    } catch {
      metaObj = { raw: String(metadata) };
    }

    // If backend returns array, take first (as before)
    if (Array.isArray(metaObj)) {
      metaObj = metaObj[0] ?? {};
    }

    metadataItems = Object.keys(metaObj || {}).map((key) => {
      const val = metaObj[key];
      const children =
        typeof val === "string" ? (
          <Input value={val} />
        ) : (
          <Descriptions bordered column={1}>
            {Object.entries(val || {}).map(([subKey, subVal]) => (
              <Descriptions.Item label={subKey} key={`${key}.${subKey}`}>
                {String(subVal)}
              </Descriptions.Item>
            ))}
          </Descriptions>
        );
      return { key, label: key, children };
    });
  }

  return (
    <Card>
      <Descriptions bordered>{descriptionItems}</Descriptions>
      {metadataItems && metadataItems.length > 0 ? (
        <Collapse accordion>
          <Collapse.Panel header="Metadata" key="metadata">
            <Collapse accordion items={metadataItems} />
          </Collapse.Panel>
        </Collapse>
      ) : null}
    </Card>
  );
}

