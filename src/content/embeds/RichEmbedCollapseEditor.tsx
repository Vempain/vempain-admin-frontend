import React, {useEffect, useState} from 'react';
import {Modal, Select, Spin} from 'antd';
import {pageAPI} from '../../services';
import type {PageResponse} from '../../models';
import {QueryDetailEnum} from '../../models';

interface RichEmbedCollapseEditorProps {
    open: boolean;
    initialId?: number;
    onConfirm: (id: number) => void;
    onCancel: () => void;
}

export function RichEmbedCollapseEditor({open, initialId, onConfirm, onCancel}: RichEmbedCollapseEditorProps) {
    const [pages, setPages] = useState<PageResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<number | undefined>(initialId);

    useEffect(() => {
        if (open) {
            setSelectedId(initialId);
            setLoading(true);
            pageAPI.findAll({details: QueryDetailEnum.MINIMAL})
                .then(setPages)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [open, initialId]);

    return (
        <Modal
            title="Insert Collapse Embed"
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
                    options={pages.map(p => ({label: p.page_path || p.title, value: p.id}))}
                    showSearch
                    optionFilterProp="label"
                    style={{width: '100%'}}
                    placeholder="Select a parent page"
                />
            </Spin>
        </Modal>
    );
}
