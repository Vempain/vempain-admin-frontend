import {Card, Collapse, Descriptions, Input, Tag} from "antd";
import type {SiteFileResponse} from "../models";
import {formatDateTimeWithMs, formatFileSize} from "../tools";

interface SiteFileCardProps {
  siteFile: SiteFileResponse & Record<string, any>;
}

const summaryKeys = new Set(["id", "file_name", "file_type", "size"]);

function formatLabel(key: string) {
    return key
            .replace(/[-_]+/g, " ")
            .split(" ")
            .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
            .join(" ");
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
    if (typeof value === "object") return <pre style={{margin: 0}}>{JSON.stringify(value, null, 2)}</pre>;
  return String(value);
}

export function SiteFileCard({siteFile}: SiteFileCardProps) {
    const {metadata, ...rest} = siteFile;

    const summaryItems = [
        {key: "id", label: formatLabel("id"), value: renderValue("id", rest.id)},
        {key: "file_name", label: formatLabel("file_name"), value: renderValue("file_name", rest.file_name)},
        {key: "file_type", label: formatLabel("file_type"), value: renderValue("file_type", rest.file_type)},
        {key: "size", label: formatLabel("size"), value: renderValue("size", rest.size)}
    ];

    const detailEntries = Object.entries(rest).filter(([key]) => !summaryKeys.has(key));

    const detailDescriptions = detailEntries.map(([key, value]) => (
            <Descriptions.Item key={key} label={formatLabel(key)}>
                {renderValue(key, value)}
            </Descriptions.Item>
  ));

    let metadataItems: { key: string; label: string; children: React.ReactNode }[] | undefined;

  if (metadata !== undefined) {
    let metaObj: any;
    try {
      metaObj = typeof metadata === "string" ? JSON.parse(metadata) : metadata;
    } catch {
        metaObj = {raw: String(metadata)};
    }

    if (Array.isArray(metaObj)) {
      metaObj = metaObj[0] ?? {};
    }

    metadataItems = Object.keys(metaObj || {}).map((key) => {
      const val = metaObj[key];
      const children =
              typeof val === "string" ? (
                      <Input value={val}/>
              ) : (
                      <Descriptions bordered column={1}>
                          {Object.entries(val || {}).map(([subKey, subVal]) => (
                                  <Descriptions.Item label={formatLabel(subKey)} key={`${key}.${subKey}`}>
                                      {String(subVal)}
                                  </Descriptions.Item>
                          ))}
                      </Descriptions>
              );
        return {key, label: formatLabel(key), children};
    });
  }

    const hasDetails = detailDescriptions.length > 0 || (metadataItems && metadataItems.length > 0);

  return (
          <Card size="small" style={{marginBottom: 12}} bodyStyle={{padding: 12}}>
              <Descriptions bordered column={4} size="small">
                  {summaryItems.map(item => (
                          <Descriptions.Item key={item.key} label={item.label}>
                              {item.value}
                          </Descriptions.Item>
                  ))}
              </Descriptions>
              {hasDetails && (
                      <Collapse ghost>
                          <Collapse.Panel header={"Details"} key="details">
                              <Descriptions bordered column={1} size="small">
                                  {detailDescriptions}
                              </Descriptions>
                              {metadataItems && metadataItems.length > 0 && (
                                      <Collapse.Panel header={"Metadata"} key="metadata">
                                          <Collapse ghost>
                                              <Collapse.Panel header={"Values"} key="values">
                                                  {metadataItems.map(item => item.children)}
                                              </Collapse.Panel>
                                          </Collapse>
                                      </Collapse.Panel>
                              )}
                          </Collapse.Panel>
                      </Collapse>
              )}
          </Card>
  );
}
