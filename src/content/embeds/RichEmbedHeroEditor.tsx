import React, {useEffect, useState} from 'react';
import {Modal, Select, Spin} from 'antd';
import {siteFileAPI} from '../../services';
import type {SiteFileResponse} from '../../models';
import {FileTypeEnum} from '../../models';

interface RichEmbedHeroEditorProps {
    open: boolean;
    initialId?: number;
    onConfirm: (id: number) => void;
    onCancel: () => void;
}

export function RichEmbedHeroEditor({open, initialId, onConfirm, onCancel}: RichEmbedHeroEditorProps) {
    const [images, setImages] = useState<SiteFileResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<number | undefined>(initialId);

    useEffect(() => {
        if (open) {
            setSelectedId(initialId);
            setLoading(true);
            siteFileAPI.getPagedSiteFiles({page_size: 200, page_number: 0, file_type: FileTypeEnum.IMAGE})
                .then(response => setImages(response.content ?? []))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [open, initialId]);

    return (
        <Modal
            title="Insert Hero Image Embed"
            open={open}
            onOk={() => selectedId != null && onConfirm(selectedId)}
            okButtonProps={{disabled: selectedId == null}}
            onCancel={onCancel}
            destroyOnClose
        >
            <Spin spinning={loading}>
                <Select
                    value={selectedId}
                    onChange={setSelectedId}
                    options={images.map(f => ({label: f.file_name, value: f.id}))}
                    showSearch
                    optionFilterProp="label"
                    style={{width: '100%'}}
                    placeholder="Select a hero image"
                />
            </Spin>
        </Modal>
    );
}
