import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Alert, Input, Modal, Spin} from 'antd';
import {siteFileAPI} from '../../services';
import type {SiteFileResponse} from '../../models';
import {FileTypeEnum} from '../../models';
import VirtualList from 'rc-virtual-list';

const PAGE_SIZE = 50;
const FILTER_COLUMN = 'fileName';
const SORT_BY = 'fileName';
const SORT_DIRECTION = 'ASC';
const LIST_HEIGHT = 320;
const ITEM_HEIGHT = 36;

interface RichEmbedImageEditorProps {
    open: boolean;
    initialId?: number;
    onConfirm: (id: number) => void;
    onCancel: () => void;
}

export function RichEmbedImageEditor({open, initialId, onConfirm, onCancel}: RichEmbedImageEditorProps) {
    const [images, setImages] = useState<SiteFileResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<number | undefined>(initialId);
    const [searchQuery, setSearchQuery] = useState('');

    // Use refs for values needed inside the scroll handler to avoid stale closures
    const pageRef = useRef(0);
    const totalPagesRef = useRef(0);
    const loadingMoreRef = useRef(false);
    const searchQueryRef = useRef('');

    const selectedLabel = useMemo(() => {
        const found = images.find((f) => f.id === selectedId);
        return found ? found.file_name : selectedId != null ? `#${selectedId}` : undefined;
    }, [images, selectedId]);

    const fetchImages = useCallback(async (pageNumber = 0, append = false, query = '') => {
        if (append) {
            setLoadingMore(true);
            loadingMoreRef.current = true;
        } else {
            setLoading(true);
        }
        setLoadError(null);
        try {
            const trimmed = query.trim();
            const params: Record<string, any> = {
                page_size: PAGE_SIZE,
                page_number: pageNumber,
                file_type: FileTypeEnum.IMAGE,
                sort_by: SORT_BY,
                direction: SORT_DIRECTION,
                filter: trimmed,
                filter_column: FILTER_COLUMN,
            };
            const response = await siteFileAPI.getPagedSiteFiles(params);
            pageRef.current = response.page;
            totalPagesRef.current = response.total_pages;
            setImages((prev) => {
                const next = append ? new Map(prev.map((item) => [item.id, item])) : new Map();
                (response.content ?? []).forEach((item) => next.set(item.id, item));
                return Array.from(next.values());
            });
        } catch (error) {
            console.error(error);
            setLoadError('Failed to load images. Please try again.');
        } finally {
            if (append) {
                setLoadingMore(false);
                loadingMoreRef.current = false;
            } else {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        if (open) {
            setSelectedId(initialId);
            setSearchQuery('');
            searchQueryRef.current = '';
            pageRef.current = 0;
            totalPagesRef.current = 0;
            void fetchImages(0, false, '');
        }
    }, [open, initialId, fetchImages]);

    const handleVirtualScroll: React.UIEventHandler<HTMLElement> = (event) => {
        const target = event.currentTarget;
        if (loadingMoreRef.current) {
            return;
        }
        const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 20;
        if (nearBottom && pageRef.current + 1 < totalPagesRef.current) {
            void fetchImages(pageRef.current + 1, true, searchQueryRef.current);
        }
    };

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchQuery(value);
        searchQueryRef.current = value;
        pageRef.current = 0;
        totalPagesRef.current = 0;
        void fetchImages(0, false, value);
    };

    return (
        <Modal
            title="Insert Image Embed"
            open={open}
            onOk={() => selectedId != null && onConfirm(selectedId)}
            okButtonProps={{disabled: selectedId == null || loadError != null}}
            onCancel={onCancel}
            destroyOnHidden={true}
        >
            <Spin spinning={loading}>
                {loadError && <Alert type="error" message={loadError} style={{marginBottom: 8}}/>}
                {selectedLabel && (
                        <div style={{marginBottom: 8}}>
                            <strong>Selected:</strong> {selectedLabel}
                        </div>
                )}
                <Input.Search
                        placeholder="Search by file name…"
                        value={searchQuery}
                        onChange={handleSearch}
                        allowClear
                        style={{marginBottom: 8}}
                />
                <VirtualList
                        data={images}
                        height={LIST_HEIGHT}
                        itemHeight={ITEM_HEIGHT}
                        itemKey="id"
                        onScroll={handleVirtualScroll}
                >
                    {(item) => (
                            <div
                                    key={item.id}
                                    style={{
                                        padding: '6px 12px',
                                        cursor: 'pointer',
                                        background: item.id === selectedId ? '#1a3a5c' : undefined,
                                        borderBottom: '1px solid #303030',
                                    }}
                                    onClick={() => setSelectedId(item.id)}
                            >
                                {item.file_name}
                            </div>
                    )}
                </VirtualList>
                {!loading && images.length === 0 && (
                        <div style={{padding: '8px 12px', color: '#999'}}>No images found</div>
                )}
                {loadingMore && (
                        <div style={{padding: '8px 12px', textAlign: 'center'}}>
                            <Spin size="small"/>
                        </div>
                )}
            </Spin>
        </Modal>
    );
}
