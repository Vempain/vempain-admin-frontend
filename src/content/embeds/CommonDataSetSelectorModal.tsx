import {Alert, Input, Modal, Spin} from 'antd';
import VirtualList from 'rc-virtual-list';
import {useCallback, useEffect, useMemo, useState} from 'react';
import type {DataSummaryResponse} from '../../models';
import {dataAPI} from '../../services';

const LIST_HEIGHT = 320;
const ITEM_HEIGHT = 48;

interface CommonDataSetSelectorModalProps {
    open: boolean;
    title: string;
    datasetType?: string;
    identifierPrefix?: string;
    initialIdentifier?: string;
    searchPlaceholder: string;
    emptyText: string;
    onConfirm: (identifier: string) => void;
    onCancel: () => void;
}

export function CommonDataSetSelectorModal({
                                               open,
                                               title,
                                               datasetType,
                                               identifierPrefix,
                                               initialIdentifier,
                                               searchPlaceholder,
                                               emptyText,
                                               onConfirm,
                                               onCancel,
                                           }: CommonDataSetSelectorModalProps) {
    const [items, setItems] = useState<DataSummaryResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [selectedIdentifier, setSelectedIdentifier] = useState<string | undefined>(initialIdentifier);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchItems = useCallback(async (query = '') => {
        setLoading(true);
        setLoadError(null);

        try {
            const response = await dataAPI.getAllDataSets({
                type: datasetType,
                identifier_prefix: identifierPrefix,
                search: query.trim() || undefined,
            });
            setItems(response);
        } catch (error) {
            console.error(error);
            setLoadError('Failed to load data sets. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [datasetType, identifierPrefix]);

    useEffect(() => {
        if (!open) {
            return;
        }
        setSelectedIdentifier(initialIdentifier);
        setSearchQuery('');
        void fetchItems('');
    }, [open, initialIdentifier, fetchItems]);

    const selectedLabel = useMemo(() => {
        const found = items.find((item) => item.identifier === selectedIdentifier);
        return found ? `${found.identifier}${found.description ? ` — ${found.description}` : ''}` : selectedIdentifier;
    }, [items, selectedIdentifier]);

    return (
            <Modal
                    title={title}
                    open={open}
                    onOk={() => selectedIdentifier != null && onConfirm(selectedIdentifier)}
                    okButtonProps={{disabled: selectedIdentifier == null || loadError != null}}
                    onCancel={onCancel}
                    destroyOnHidden
            >
                <Spin spinning={loading}>
                    {loadError && <Alert type="error" message={loadError} style={{marginBottom: 8}}/>}
                    {selectedLabel && (
                            <div style={{marginBottom: 8}}>
                                <strong>Selected:</strong> {selectedLabel}
                            </div>
                    )}
                    <Input.Search
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChange={(event) => {
                                const next = event.target.value;
                                setSearchQuery(next);
                                void fetchItems(next);
                            }}
                            allowClear
                            style={{marginBottom: 8}}
                    />
                    <VirtualList
                            data={items}
                            height={LIST_HEIGHT}
                            itemHeight={ITEM_HEIGHT}
                            itemKey="identifier"
                    >
                        {(item) => (
                                <div
                                        key={item.identifier}
                                        style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            background: item.identifier === selectedIdentifier ? '#1a3a5c' : undefined,
                                            borderBottom: '1px solid #303030',
                                        }}
                                        onClick={() => setSelectedIdentifier(item.identifier)}
                                >
                                    <div>{item.identifier}</div>
                                    {item.description && (
                                            <div style={{fontSize: '0.85em', color: '#999'}}>{item.description}</div>
                                    )}
                                </div>
                        )}
                    </VirtualList>
                    {!loading && items.length === 0 && (
                            <div style={{padding: '8px 12px', color: '#999'}}>{emptyText}</div>
                    )}
                </Spin>
            </Modal>
    );
}

