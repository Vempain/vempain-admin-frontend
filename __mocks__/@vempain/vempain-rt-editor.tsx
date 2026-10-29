/* eslint-disable react-refresh/only-export-components -- Jest manual stub, not an application module */
/**
 * Jest stub of @vempain/vempain-rt-editor (ESM-only build). It keeps the host contract of `RichTextEditor`: a controlled value,
 * `onChange` with the new body, `onEmbedsChange` with the embeds of the current body (parsed with the same comment-tag grammar) and
 * the `dataProviders` the host wires to its services, exposed to tests through `rtEditorTestHooks`.
 */
import {useEffect} from "react";
import {parseEmbeds} from "../../src/tools/embedTools";

export interface RichTextEditorProps {
    value?: string;
    onChange?: (value: string) => void;
    onEmbedsChange?: (embeds: unknown[]) => void;
    readOnly?: boolean;
    dataProviders?: Record<string, (params?: unknown) => Promise<unknown>>;
    pageStyle?: string | null;
}

export const rtEditorTestHooks: { dataProviders?: Record<string, (params?: unknown) => Promise<unknown>> } = {};

export function RichTextEditor({value, onChange, onEmbedsChange, readOnly, dataProviders, pageStyle}: RichTextEditorProps) {
    const body = value ?? "";

    useEffect(() => {
        rtEditorTestHooks.dataProviders = dataProviders;
    }, [dataProviders]);

    useEffect(() => {
        onEmbedsChange?.(parseEmbeds(body)
                .filter(segment => segment.kind === "embed")
                .map(segment => segment.descriptor)
                .map(descriptor => {
                    if (descriptor.type !== "hero") {
                        return descriptor;
                    }
                    // Same grammar as the library: `hero:<id>:type:<image|video|carousel>`
                    const parts = descriptor.extra?.split(":") ?? [];
                    const heroType = parts[0] === "type" ? parts[1]?.toLowerCase() : "image";
                    return {...descriptor, heroType: heroType === "video" || heroType === "carousel" ? heroType : "image"};
                }));
    }, [body, onEmbedsChange]);

    return (
            <>
                {pageStyle?.trim() && <style data-testid="rich-text-editor-page-style">{pageStyle}</style>}
                <textarea data-testid="rich-text-editor" readOnly={readOnly} value={body} onChange={event => onChange?.(event.target.value)}/>
            </>
    );
}

export interface PageStyleEditorProps {
    value?: string | null;
    onChange?: (css: string) => void;
    readOnly?: boolean;
    rows?: number;
    placeholder?: string;
    "aria-label"?: string;
}

/** The style editor reduced to its CSS text mode: the host contract is a controlled string like an input's. */
export function PageStyleEditor({value, onChange, readOnly, rows, placeholder, "aria-label": ariaLabel = "Page style"}: PageStyleEditorProps) {
    return (
            <textarea data-testid="page-style-editor" aria-label={ariaLabel} readOnly={readOnly} rows={rows} placeholder={placeholder}
                      value={value ?? ""} onChange={event => onChange?.(event.target.value)}/>
    );
}
