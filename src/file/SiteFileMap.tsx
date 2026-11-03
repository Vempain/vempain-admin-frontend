import 'leaflet/dist/leaflet.css';
import {Descriptions, Tag, Typography} from "antd";
import {type MapFileResponse, MapView} from "@vempain/vempain-common-frontend";
import {mapAPI, tagAPI} from "../services";
import {FileTypeEnum} from "../models";
import {formatCoordinates, formatDateTime, MAP_ATTRIBUTION, MAP_TILE_URL} from "../tools";
import {SiteFileThumbnail} from "./SiteFileThumbnail";

/** The file types a site file can have on the map; thumbnails are derived files and never carry coordinates of their own */
const MAP_FILE_TYPES = Object.values(FileTypeEnum).filter(type => type !== FileTypeEnum.THUMB);

/** The details of a site file clicked on the map */
export function SiteFileMapDetails({file}: { file: MapFileResponse }) {
    return (
            <Descriptions column={1} size="small" bordered data-testid="site-file-map-details">
                <Descriptions.Item label="ID">{file.id}</Descriptions.Item>
                <Descriptions.Item label="File name">{file.filename}</Descriptions.Item>
                <Descriptions.Item label="Path">{file.file_path}</Descriptions.Item>
                <Descriptions.Item label="Type"><Tag>{file.file_type}</Tag> {file.mimetype}</Descriptions.Item>
                <Descriptions.Item label="Taken">{file.original_datetime ? formatDateTime(file.original_datetime) : "-"}</Descriptions.Item>
                <Descriptions.Item label="Coordinates">{formatCoordinates(file)}</Descriptions.Item>
            </Descriptions>
    );
}

/**
 * The map of the published site files with GPS coordinates (File Management > Map): the shared map view of vempain-common-frontend over the
 * admin backend's /map endpoints, which cluster the readable site files. A clicked file shows its thumbnail (through the admin backend) and
 * its details.
 */
export function SiteFileMap() {
    return (
            <div>
                <Typography.Title level={3}>Map of site files</Typography.Title>
                <Typography.Text type="secondary">
                    Every published site file with GPS coordinates you may read; the points are clustered by the backend, zoom in or hover a cluster
                    to see the files.
                </Typography.Text>
                <MapView
                        source={mapAPI}
                        fileTypes={MAP_FILE_TYPES.map(type => ({value: type, label: type}))}
                        tileUrl={MAP_TILE_URL}
                        attribution={MAP_ATTRIBUTION}
                        searchTags={search => tagAPI.search(search).then(tags => tags.map(tag => tag.tag_name))}
                        renderThumbnail={file => <SiteFileThumbnail siteFileId={file.id}/>}
                        renderFileDetails={file => <SiteFileMapDetails file={file}/>}
                />
            </div>
    );
}
