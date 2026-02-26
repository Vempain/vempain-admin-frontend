import {buildEmbedTag, convertPlaceholdersToTags, convertTagsToPlaceholders, type EmbedType} from '../tools/embedTools';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Button, Form, Input, InputNumber, Modal, Select, Space, Switch, Tooltip} from 'antd';
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

interface RichTextEditorProps {
    value?: string;
    onChange?: (value: string) => void;
}

interface EmbedDialogState {
    open: boolean;
    type: EmbedType | null;
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
 */
export function RichTextEditor({value, onChange}: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [sourceMode, setSourceMode] = useState(false);
    // htmlContent mirrors the canonical HTML without placeholders
    const htmlContentRef = useRef<string>(value || '');
    const [, forceRender] = useState(0);

    const [embedDialog, setEmbedDialog] = useState<EmbedDialogState>({open: false, type: null});
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);

    const [embedForm] = Form.useForm();
    const [linkForm] = Form.useForm();

    // Initialise editor content on mount
    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.innerHTML = convertTagsToPlaceholders(value || '');
        }
        htmlContentRef.current = value || '';
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    const handleEditorInput = () => {
        const html = getEditorHtml();
        htmlContentRef.current = html;
        prevValueRef.current = html;
        onChange?.(html);
    };

    const handleSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        htmlContentRef.current = e.target.value;
        prevValueRef.current = e.target.value;
        onChange?.(e.target.value);
    };

    const handleModeSwitch = (toSource: boolean) => {
        if (toSource) {
            // Capture WYSIWYG content before switching
            const html = getEditorHtml();
            htmlContentRef.current = html;
            prevValueRef.current = html;
        } else {
            // Restore WYSIWYG view from latest source
            if (editorRef.current) {
                editorRef.current.innerHTML = convertTagsToPlaceholders(htmlContentRef.current);
            }
        }
        setSourceMode(toSource);
        forceRender(n => n + 1);
    };

    // Execute document.execCommand for basic formatting.
    // Note: execCommand is deprecated in the HTML spec but remains the only
    // native way to implement rich text editing without an external library.
    // All major browsers continue to support it and no removal timeline has
    // been announced as of 2024.
    const execCmd = (command: string, cmdValue?: string) => {
        editorRef.current?.focus();
        document.execCommand(command, false, cmdValue);
        handleEditorInput();
    };

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
        embedForm.resetFields();
        setEmbedDialog({open: true, type});
    };

    const handleEmbedInsert = () => {
        embedForm.validateFields().then((values) => {
            if (!embedDialog.type) return;

            let tag: string;
            if (embedDialog.type === 'carousel') {
                const extra = `${values.autoplay ?? false}:${values.dotDuration ?? false}:${values.speed ?? 500}`;
                tag = buildEmbedTag({type: 'carousel', id: values.id, extra});
            } else {
                tag = buildEmbedTag({type: embedDialog.type, id: values.id});
            }

            const placeholder = convertTagsToPlaceholders(tag);
            execCmd('insertHTML', placeholder);
            setEmbedDialog({open: false, type: null});
        });
    };

    const handleLinkInsert = () => {
        linkForm.validateFields().then((values) => {
            insertLink(values.url, values.text);
            setLinkDialogOpen(false);
        });
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

            {/* Embed insertion dialog */}
            <Modal
                title={`Insert ${embedDialog.type ? embedDialog.type.charAt(0).toUpperCase() + embedDialog.type.slice(1) : ''} Embed`}
                open={embedDialog.open}
                onOk={handleEmbedInsert}
                onCancel={() => setEmbedDialog({open: false, type: null})}
                destroyOnClose={true}
            >
                <Form form={embedForm} layout="vertical">
                    {(embedDialog.type === 'gallery' || embedDialog.type === 'image' || embedDialog.type === 'hero') && (
                        <Form.Item
                            name="id"
                            label={embedDialog.type === 'gallery' ? 'Gallery ID' : 'File ID'}
                            rules={[{required: true, message: 'Please enter an ID'}]}
                        >
                            <InputNumber min={1} style={{width: '100%'}} placeholder="Enter numeric ID"/>
                        </Form.Item>
                    )}
                    {(embedDialog.type === 'collapse' || embedDialog.type === 'carousel') && (
                        <Form.Item
                            name="id"
                            label="Parent Page ID"
                            rules={[{required: true, message: 'Please enter a parent page ID'}]}
                        >
                            <InputNumber min={1} style={{width: '100%'}} placeholder="Enter parent page ID"/>
                        </Form.Item>
                    )}
                    {embedDialog.type === 'carousel' && (
                        <>
                            <Form.Item name="autoplay" label="Autoplay" valuePropName="checked" initialValue={false}>
                                <Switch/>
                            </Form.Item>
                            <Form.Item name="dotDuration" label="Dot Duration" valuePropName="checked"
                                       initialValue={false}>
                                <Switch/>
                            </Form.Item>
                            <Form.Item name="speed" label="Transition Speed (ms)" initialValue={500}>
                                <InputNumber min={100} max={10000} style={{width: '100%'}}/>
                            </Form.Item>
                        </>
                    )}
                </Form>
            </Modal>
        </div>
    );
}
