import React, {useEffect, useState} from 'react';
import {Alert, Modal, Select, Spin} from 'antd';
import {siteFileAPI} from '../../services';
import type {SiteFileResponse} from '../../models';
import {FileTypeEnum} from '../../models';

interface RichEmbedImageEditorProps {
    open: boolean;
    initialId?: number;
    onConfirm: (id: number) => void;
    onCancel: () => void;
}

export function RichEmbedImageEditor({open, initialId, onConfirm, onCancel}: RichEmbedImageEditorProps) {
    const [images, setImages] = useState<SiteFileResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<number | undefined>(initialId);

    useEffect(() => {
        if (open) {
            setSelectedId(initialId);
            setLoadError(null);
            setLoading(true);
            siteFileAPI.getPagedSiteFiles({page_size: 1000, page_number: 0, file_type: FileTypeEnum.IMAGE})
                .then(response => setImages(response.content ?? []))
                .catch((error) => {
                    console.error(error);
                    setLoadError('Failed to load images. Please try again.');
                })
                .finally(() => setLoading(false));
        }
    }, [open, initialId]);

    return (
        <Modal
            title="Insert Image Embed"
            open={open}
            onOk={() => selectedId != null && onConfirm(selectedId)}
            okButtonProps={{disabled: selectedId == null || loadError != null}}
            onCancel={onCancel}
            destroyOnClose
        >
            <Spin spinning={loading}>
                {loadError && <Alert type="error" message={loadError} style={{marginBottom: 8}}/>}
                <Select
                    value={selectedId}
                    onChange={setSelectedId}
                    options={images.map(f => ({label: f.file_name, value: f.id}))}
                    showSearch
                    optionFilterProp="label"
                    style={{width: '100%'}}
                    placeholder="Select an image"
                    disabled={loadError != null}
                />
            </Spin>
        </Modal>
    );
}
