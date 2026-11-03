import {Image, Spin, Typography} from "antd";
import {useEffect, useState} from "react";
import {siteFileAPI} from "../services";

interface SiteFileThumbnailProps {
    siteFileId: number;
    maxSize?: number;
}

/**
 * The thumbnail of a site file, fetched with the session through the admin backend (the admin SPA has no other access to file content) and
 * shown from an object URL; a site file without a thumbnail shows a short note instead.
 */
export function SiteFileThumbnail({siteFileId, maxSize = 240}: SiteFileThumbnailProps) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [missing, setMissing] = useState<boolean>(false);

    useEffect(() => {
        let active = true;
        let objectUrl: string | null = null;
        setLoading(true);
        setImageUrl(null);
        setMissing(false);
        siteFileAPI.getThumbnail(siteFileId)
                .then(blob => {
                    if (!active) return;
                    objectUrl = URL.createObjectURL(blob);
                    setImageUrl(objectUrl);
                })
                .catch(() => {
                    if (active) setMissing(true);
                })
                .finally(() => {
                    if (active) setLoading(false);
                });
        return () => {
            active = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [siteFileId]);

    return (
            <Spin spinning={loading}>
                {imageUrl && <Image alt={`Site file ${siteFileId}`} preview={false} src={imageUrl} style={{maxWidth: maxSize, maxHeight: maxSize}}/>}
                {missing && <Typography.Text type="secondary" data-testid="site-file-thumbnail-missing">No thumbnail</Typography.Text>}
            </Spin>
    );
}
