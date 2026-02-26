import React, {useEffect, useState} from 'react';
import {Modal, Select, Spin} from 'antd';
import {galleryAPI} from '../../services';
import type {GalleryVO} from '../../models';
import {QueryDetailEnum} from '../../models';

interface RichEmbedGalleryEditorProps {
    open: boolean;
    initialId?: number;
    onConfirm: (id: number) => void;
    onCancel: () => void;
}

export function RichEmbedGalleryEditor({open, initialId, onConfirm, onCancel}: RichEmbedGalleryEditorProps) {
    const [galleries, setGalleries] = useState<GalleryVO[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<number | undefined>(initialId);

    useEffect(() => {
        if (open) {
            setSelectedId(initialId);
            setLoading(true);
            galleryAPI.findAll({details: QueryDetailEnum.MINIMAL})
                .then(setGalleries)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [open, initialId]);

    return (
        <Modal
            title="Insert Gallery Embed"
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
                    options={galleries.map(g => ({label: g.short_name, value: g.id}))}
                    showSearch
                    optionFilterProp="label"
                    style={{width: '100%'}}
                    placeholder="Select a gallery"
                />
            </Spin>
        </Modal>
    );
}
