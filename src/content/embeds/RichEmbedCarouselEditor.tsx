import React, {useEffect, useState} from 'react';
import {Form, InputNumber, Modal, Select, Spin, Switch} from 'antd';
import {pageAPI} from '../../services';
import type {PageResponse} from '../../models';
import {QueryDetailEnum} from '../../models';

interface RichEmbedCarouselEditorProps {
    open: boolean;
    initialId?: number;
    initialAutoplay?: boolean;
    initialDotDuration?: boolean;
    initialSpeed?: number;
    onConfirm: (id: number, autoplay: boolean, dotDuration: boolean, speed: number) => void;
    onCancel: () => void;
}

export function RichEmbedCarouselEditor({
    open,
    initialId,
    initialAutoplay = false,
    initialDotDuration = false,
    initialSpeed = 500,
    onConfirm,
    onCancel,
}: RichEmbedCarouselEditorProps) {
    const [pages, setPages] = useState<PageResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<number | undefined>(initialId);
    const [form] = Form.useForm();

    useEffect(() => {
        if (open) {
            setSelectedId(initialId);
            form.setFieldsValue({autoplay: initialAutoplay, dotDuration: initialDotDuration, speed: initialSpeed});
            setLoading(true);
            pageAPI.findAll({details: QueryDetailEnum.MINIMAL})
                .then(setPages)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [open, initialId, initialAutoplay, initialDotDuration, initialSpeed, form]);

    const handleOk = () => {
        form.validateFields().then(values => {
            if (selectedId != null) {
                onConfirm(selectedId, values.autoplay ?? false, values.dotDuration ?? false, values.speed ?? 500);
            }
        }).catch(() => {
            // validation failed — stay in dialog
        });
    };

    return (
        <Modal
            title="Insert Carousel Embed"
            open={open}
            onOk={handleOk}
            okButtonProps={{disabled: selectedId == null}}
            onCancel={onCancel}
            destroyOnClose
        >
            <Spin spinning={loading}>
                <Form form={form} layout="vertical">
                    <Form.Item label="Parent Page" required>
                        <Select
                            value={selectedId}
                            onChange={setSelectedId}
                            options={pages.map(p => ({label: p.page_path || p.title, value: p.id}))}
                            showSearch
                            optionFilterProp="label"
                            style={{width: '100%'}}
                            placeholder="Select a parent page"
                        />
                    </Form.Item>
                    <Form.Item name="autoplay" label="Autoplay" valuePropName="checked">
                        <Switch/>
                    </Form.Item>
                    <Form.Item name="dotDuration" label="Dot Duration" valuePropName="checked">
                        <Switch/>
                    </Form.Item>
                    <Form.Item name="speed" label="Transition Speed (ms)">
                        <InputNumber min={100} max={10000} style={{width: '100%'}}/>
                    </Form.Item>
                </Form>
            </Spin>
        </Modal>
    );
}
