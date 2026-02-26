import {buildEmbedTag, buildCarouselTag, convertPlaceholdersToTags, convertTagsToPlaceholders, parseCarouselParams, type EmbedType} from '../tools/embedTools';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Button, Form, Input, Modal, Select, Space, Tooltip} from 'antd';
import {
    BoldOutlined,
    CaretRightOutlined,
    CodeOutlined,
    ItalicOutlined,
    LinkOutlined,
    OrderedListOutlined,
    PictureFilled,
    PictureOutlined,
    StrikethroughOutlined,
    TableOutlined,
    UnderlineOutlined,
    UnorderedListOutlined,
} from '@ant-design/icons';
import DOMPurify from 'dompurify';
import {RichEmbedGalleryEditor} from './embeds/RichEmbedGalleryEditor';
import {RichEmbedImageEditor} from './embeds/RichEmbedImageEditor';
import {RichEmbedHeroEditor} from './embeds/RichEmbedHeroEditor';
import {RichEmbedCollapseEditor} from './embeds/RichEmbedCollapseEditor';
import {RichEmbedCarouselEditor} from './embeds/RichEmbedCarouselEditor';

interface RichTextEditorProps {
    value?: string;
    onChange?: (value: string) => void;
}

interface EmbedDialogState {
    open: boolean;
    type: EmbedType | null;
    /** ID of the embed being edited (undefined = new insertion) */
    initialId?: number;
    /** Extra params string for carousel edits */
    initialExtra?: string;
}

/**
 * Custom rich text editor component that replaces the plain TextArea
 * for editing page body content.
 *
 * Features:
 * - Basic formatting (bold, italic, underline, strikethrough)
 * - Headings (H1–H6)
 * - Lists (ordered, unordered)
 * - Link insertion
 * - Table insertion
 * - Embed tag insertion (gallery, image, hero, collapse, carousel)
 * - Toggle between WYSIWYG and HTML source view
 * - Click-to-edit for existing embed placeholders
 */
export function RichTextEditor({value, onChange}: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [sourceMode, setSourceMode] = useState(false);
    // htmlContent mirrors the canonical HTML without placeholders
    const htmlContentRef = useRef<string>(value || '');
    // Reference to the placeholder span being edited (null = new insertion)
    const editingPlaceholderRef = useRef<HTMLElement | null>(null);

    const [embedDialog, setEmbedDialog] = useState<EmbedDialogState>({open: false, type: null});
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);

    const [linkForm] = Form.useForm();

    // Initialise htmlContentRef on mount
    useEffect(() => {
        htmlContentRef.current = value || '';
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Restore editor content whenever switching back to WYSIWYG mode.
    // This runs after the render that mounts the contentEditable div,
    // so editorRef.current is guaranteed to be non-null.
    useEffect(() => {
        if (!sourceMode && editorRef.current) {
            editorRef.current.innerHTML = convertTagsToPlaceholders(htmlContentRef.current);
        }
    }, [sourceMode]);

    // Sync from outside (e.g. form reset) when value changes significantly
    const prevValueRef = useRef<string>(value || '');
    useEffect(() => {
        if (value !== prevValueRef.current && value !== htmlContentRef.current) {
            prevValueRef.current = value || '';
            htmlContentRef.current = value || '';
            if (!sourceMode && editorRef.current) {
                editorRef.current.innerHTML = convertTagsToPlaceholders(value || '');
            }
        }
    }, [value, sourceMode]);

    const getEditorHtml = useCallback((): string => {
        if (!editorRef.current) return htmlContentRef.current;
        return convertPlaceholdersToTags(editorRef.current.innerHTML);
    }, []);

    const handleEditorInput = useCallback(() => {
        const html = getEditorHtml();
        htmlContentRef.current = html;
        prevValueRef.current = html;
        onChange?.(html);
    }, [getEditorHtml, onChange]);

    const handleSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        htmlContentRef.current = e.target.value;
        prevValueRef.current = e.target.value;
        onChange?.(e.target.value);
    };

    const handleModeSwitch = (toSource: boolean) => {
        if (toSource) {
            // Capture current WYSIWYG content before switching to source view
            const html = getEditorHtml();
            htmlContentRef.current = html;
            prevValueRef.current = html;
        }
        // When switching back to WYSIWYG the useEffect on sourceMode restores the content
        setSourceMode(toSource);
    };

    // Execute document.execCommand for basic formatting.
    // Note: execCommand is deprecated in the HTML spec but remains the only
    // native way to implement rich text editing without an external library.
    // All major browsers continue to support it and no removal timeline has
    // been announced as of 2024.
    const execCmd = useCallback((command: string, cmdValue?: string) => {
        editorRef.current?.focus();
        document.execCommand(command, false, cmdValue);
        handleEditorInput();
    }, [handleEditorInput]);

    const insertHeading = (level: string) => {
        editorRef.current?.focus();
        document.execCommand('formatBlock', false, level);
        handleEditorInput();
    };

    const insertTable = () => {
        const rows = 3;
        const cols = 3;
        let html = '<table border="1" style="border-collapse:collapse;width:100%"><tbody>';
        for (let r = 0; r < rows; r++) {
            html += '<tr>';
            for (let c = 0; c < cols; c++) {
                html += r === 0 ? '<th style="padding:4px;"></th>' : '<td style="padding:4px;"></td>';
            }
            html += '</tr>';
        }
        html += '</tbody></table><p></p>';
        execCmd('insertHTML', html);
    };

    const insertLink = (url: string, text: string) => {
        editorRef.current?.focus();
        // Reject dangerous URL schemes (javascript:, data:, vbscript:, etc.)
        const trimmedUrl = url.trim().toLowerCase();
        const dangerousSchemes = ['javascript:', 'data:', 'vbscript:'];
        const safeUrl = dangerousSchemes.some(s => trimmedUrl.startsWith(s)) ? '#' : url;
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
            execCmd('createLink', safeUrl);
        } else {
            const escapedUrl = DOMPurify.sanitize(safeUrl, {ALLOWED_TAGS: []});
            const escapedText = DOMPurify.sanitize(text || safeUrl, {ALLOWED_TAGS: []});
            execCmd('insertHTML', `<a href="${escapedUrl}">${escapedText}</a>`);
        }
    };

    const openEmbedDialog = (type: EmbedType) => {
        editingPlaceholderRef.current = null;
        setEmbedDialog({open: true, type});
    };

    /** Replace a placeholder span in the editor with a new one, or insert at cursor if none. */
    const insertOrReplacePlaceholder = useCallback((tag: string) => {
        const placeholder = editingPlaceholderRef.current;
        const newHtml = convertTagsToPlaceholders(tag);

        if (placeholder && editorRef.current?.contains(placeholder)) {
            placeholder.outerHTML = newHtml;
            handleEditorInput();
        } else {
            execCmd('insertHTML', newHtml);
        }
        editingPlaceholderRef.current = null;
    }, [execCmd, handleEditorInput]);

    const handleGalleryConfirm = (id: number) => {
        const tag = buildEmbedTag({type: 'gallery', id});
        insertOrReplacePlaceholder(tag);
        setEmbedDialog({open: false, type: null});
    };

    const handleImageConfirm = (id: number) => {
        const tag = buildEmbedTag({type: 'image', id});
        insertOrReplacePlaceholder(tag);
        setEmbedDialog({open: false, type: null});
    };

    const handleHeroConfirm = (id: number) => {
        const tag = buildEmbedTag({type: 'hero', id});
        insertOrReplacePlaceholder(tag);
        setEmbedDialog({open: false, type: null});
    };

    const handleCollapseConfirm = (id: number) => {
        const tag = buildEmbedTag({type: 'collapse', id});
        insertOrReplacePlaceholder(tag);
        setEmbedDialog({open: false, type: null});
    };

    const handleCarouselConfirm = (id: number, autoplay: boolean, dotDuration: boolean, speed: number) => {
        const tag = buildCarouselTag(id, {autoplay, dotDuration, speed});
        insertOrReplacePlaceholder(tag);
        setEmbedDialog({open: false, type: null});
    };

    const handleEmbedCancel = () => {
        editingPlaceholderRef.current = null;
        setEmbedDialog({open: false, type: null});
    };

    const handleLinkInsert = () => {
        linkForm.validateFields().then((values) => {
            insertLink(values.url, values.text);
            setLinkDialogOpen(false);
        });
    };

    /** Handle clicks on the contentEditable area to detect placeholder clicks. */
    const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        const placeholder = target.closest('.vps-embed-placeholder') as HTMLElement | null;
        if (placeholder) {
            const type = placeholder.dataset.type as EmbedType;
            const rawId = placeholder.dataset.id;
            const id = rawId ? parseInt(rawId, 10) : NaN;
            if (!type || isNaN(id)) return;
            const extra = placeholder.dataset.extra || '';
            editingPlaceholderRef.current = placeholder;
            setEmbedDialog({open: true, type, initialId: id, initialExtra: extra || undefined});
        }
    };

    const toolbarStyle: React.CSSProperties = {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 4,
        padding: '6px 8px',
        background: '#1a1a2e',
        border: '1px solid #333',
        borderBottom: 'none',
        borderRadius: '4px 4px 0 0',
    };

    const editorContainerStyle: React.CSSProperties = {
        border: '1px solid #333',
        borderRadius: '0 0 4px 4px',
        minHeight: 300,
        background: '#0d0d1a',
    };

    const editorStyle: React.CSSProperties = {
        padding: '8px',
        minHeight: 300,
        outline: 'none',
        color: '#E0E0E0',
        fontSize: '14px',
        lineHeight: '1.6',
    };

    const sourceStyle: React.CSSProperties = {
        width: '100%',
        minHeight: 300,
        padding: '8px',
        background: '#0d0d1a',
        color: '#E0E0E0',
        fontFamily: 'monospace',
        fontSize: '13px',
        border: 'none',
        resize: 'vertical',
        outline: 'none',
    };

    const embedButtonStyle: React.CSSProperties = {
        background: '#1a3a5c',
        borderColor: '#4a90d9',
        color: '#90c4f8',
        fontSize: '11px',
    };

    const headingOptions = [
        {label: 'Normal', value: 'p'},
        {label: 'H1', value: 'h1'},
        {label: 'H2', value: 'h2'},
        {label: 'H3', value: 'h3'},
        {label: 'H4', value: 'h4'},
        {label: 'H5', value: 'h5'},
        {label: 'H6', value: 'h6'},
    ];

    const carouselParams = embedDialog.initialExtra
        ? parseCarouselParams(embedDialog.initialExtra)
        : undefined;

    return (
        <div style={{width: '100%'}}>
            {/* Toolbar */}
            <div style={toolbarStyle}>
                {/* Format block selector */}
                <Select
                    size="small"
                    defaultValue="p"
                    style={{width: 90}}
                    options={headingOptions}
                    onChange={(v) => insertHeading(v)}
                />
                <Space.Compact size="small">
                    <Tooltip title="Bold (Ctrl+B)">
                        <Button size="small" icon={<BoldOutlined/>} onMouseDown={(e) => {
                            e.preventDefault();
                            execCmd('bold');
                        }}/>
                    </Tooltip>
                    <Tooltip title="Italic (Ctrl+I)">
                        <Button size="small" icon={<ItalicOutlined/>} onMouseDown={(e) => {
                            e.preventDefault();
                            execCmd('italic');
                        }}/>
                    </Tooltip>
                    <Tooltip title="Underline (Ctrl+U)">
                        <Button size="small" icon={<UnderlineOutlined/>} onMouseDown={(e) => {
                            e.preventDefault();
                            execCmd('underline');
                        }}/>
                    </Tooltip>
                    <Tooltip title="Strikethrough">
                        <Button size="small" icon={<StrikethroughOutlined/>} onMouseDown={(e) => {
                            e.preventDefault();
                            execCmd('strikeThrough');
                        }}/>
                    </Tooltip>
                </Space.Compact>

                <Space.Compact size="small">
                    <Tooltip title="Ordered List">
                        <Button size="small" icon={<OrderedListOutlined/>} onMouseDown={(e) => {
                            e.preventDefault();
                            execCmd('insertOrderedList');
                        }}/>
                    </Tooltip>
                    <Tooltip title="Unordered List">
                        <Button size="small" icon={<UnorderedListOutlined/>} onMouseDown={(e) => {
                            e.preventDefault();
                            execCmd('insertUnorderedList');
                        }}/>
                    </Tooltip>
                </Space.Compact>

                <Space.Compact size="small">
                    <Tooltip title="Insert Link">
                        <Button size="small" icon={<LinkOutlined/>} onMouseDown={(e) => {
                            e.preventDefault();
                            setLinkDialogOpen(true);
                        }}/>
                    </Tooltip>
                    <Tooltip title="Insert Table (3×3)">
                        <Button size="small" icon={<TableOutlined/>} onMouseDown={(e) => {
                            e.preventDefault();
                            insertTable();
                        }}/>
                    </Tooltip>
                </Space.Compact>

                {/* Embed insertion buttons */}
                <Space.Compact size="small">
                    <Tooltip title="Insert Gallery Embed">
                        <Button size="small" style={embedButtonStyle} onMouseDown={(e) => {
                            e.preventDefault();
                            openEmbedDialog('gallery');
                        }}>Gallery</Button>
                    </Tooltip>
                    <Tooltip title="Insert Image Embed">
                        <Button size="small" style={embedButtonStyle} icon={<PictureOutlined/>}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    openEmbedDialog('image');
                                }}>Img</Button>
                    </Tooltip>
                    <Tooltip title="Insert Hero Image Embed">
                        <Button size="small" style={embedButtonStyle} icon={<PictureFilled/>}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    openEmbedDialog('hero');
                                }}>Hero</Button>
                    </Tooltip>
                    <Tooltip title="Insert Collapse Embed">
                        <Button size="small" style={embedButtonStyle} onMouseDown={(e) => {
                            e.preventDefault();
                            openEmbedDialog('collapse');
                        }}>Collapse</Button>
                    </Tooltip>
                    <Tooltip title="Insert Carousel Embed">
                        <Button size="small" style={embedButtonStyle} icon={<CaretRightOutlined/>}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    openEmbedDialog('carousel');
                                }}>Carousel</Button>
                    </Tooltip>
                </Space.Compact>

                {/* Source mode toggle */}
                <Tooltip title={sourceMode ? 'Switch to WYSIWYG' : 'Switch to HTML source'}>
                    <Button
                        size="small"
                        icon={<CodeOutlined/>}
                        type={sourceMode ? 'primary' : 'default'}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            handleModeSwitch(!sourceMode);
                        }}
                    >
                        {sourceMode ? 'WYSIWYG' : 'HTML'}
                    </Button>
                </Tooltip>
            </div>

            {/* Editor area */}
            <div style={editorContainerStyle}>
                {sourceMode ? (
                    <textarea
                        style={sourceStyle}
                        value={htmlContentRef.current}
                        onChange={handleSourceChange}
                    />
                ) : (
                    <div
                        ref={editorRef}
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                        style={editorStyle}
                        onInput={handleEditorInput}
                        onBlur={handleEditorInput}
                        onClick={handleEditorClick}
                    />
                )}
            </div>

            {/* Link insertion dialog */}
            <Modal
                title="Insert Link"
                open={linkDialogOpen}
                onOk={handleLinkInsert}
                onCancel={() => setLinkDialogOpen(false)}
                destroyOnClose={true}
            >
                <Form form={linkForm} layout="vertical">
                    <Form.Item name="url" label="URL" rules={[{required: true, message: 'Please enter a URL'}]}>
                        <Input placeholder="https://example.com"/>
                    </Form.Item>
                    <Form.Item name="text" label="Link text (optional)">
                        <Input placeholder="Link text"/>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Per-embed editor dialogs */}
            <RichEmbedGalleryEditor
                open={embedDialog.open && embedDialog.type === 'gallery'}
                initialId={embedDialog.initialId}
                onConfirm={handleGalleryConfirm}
                onCancel={handleEmbedCancel}
            />
            <RichEmbedImageEditor
                open={embedDialog.open && embedDialog.type === 'image'}
                initialId={embedDialog.initialId}
                onConfirm={handleImageConfirm}
                onCancel={handleEmbedCancel}
            />
            <RichEmbedHeroEditor
                open={embedDialog.open && embedDialog.type === 'hero'}
                initialId={embedDialog.initialId}
                onConfirm={handleHeroConfirm}
                onCancel={handleEmbedCancel}
            />
            <RichEmbedCollapseEditor
                open={embedDialog.open && embedDialog.type === 'collapse'}
                initialId={embedDialog.initialId}
                onConfirm={handleCollapseConfirm}
                onCancel={handleEmbedCancel}
            />
            <RichEmbedCarouselEditor
                open={embedDialog.open && embedDialog.type === 'carousel'}
                initialId={embedDialog.initialId}
                initialAutoplay={carouselParams?.autoplay}
                initialDotDuration={carouselParams?.dotDuration}
                initialSpeed={carouselParams?.speed}
                onConfirm={handleCarouselConfirm}
                onCancel={handleEmbedCancel}
            />
        </div>
    );
}
