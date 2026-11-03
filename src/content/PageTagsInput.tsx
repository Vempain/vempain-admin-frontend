import {Select} from "antd";
import {useEffect, useRef, useState} from "react";
import {tagAPI} from "../services";

interface PageTagsInputProps {
    /** Provided by Form.Item */
    value?: string[];
    /** Provided by Form.Item */
    onChange?: (value: string[]) => void;
    placeholder?: string;
    "aria-label"?: string;
    /** Delay between the last keystroke and the suggestion request */
    debounceMs?: number;
}

export const TAG_SUGGESTION_DEBOUNCE_MS = 250;

/**
 * Tags field of the page editor: a tags Select whose suggestions are the tags the admin backend already knows, the tags of the
 * published files (sent by the file backend with every publish) and the tags of other pages, searched case-insensitively while typing.
 * Opening the field lists the first tags, a comma or Enter still adds the typed text as a new tag, which becomes a subject when the
 * page is saved.
 */
export function PageTagsInput({value, onChange, placeholder, "aria-label": ariaLabel, debounceMs = TAG_SUGGESTION_DEBOUNCE_MS}: PageTagsInputProps) {
    const [options, setOptions] = useState<{ value: string }[]>([]);
    const requestRef = useRef(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => {
        if (timerRef.current !== null) clearTimeout(timerRef.current);
        // Drop answers of requests that are still in flight when the field unmounts
        requestRef.current++;
    }, []);

    function load(typed: string, delay: number) {
        if (timerRef.current !== null) clearTimeout(timerRef.current);
        const requestId = ++requestRef.current;

        timerRef.current = setTimeout(() => {
            tagAPI.search(typed.trim())
                    .then(tags => {
                        if (requestId !== requestRef.current) return;
                        setOptions(tags.map(tag => ({value: tag.tag_name})));
                    })
                    .catch(error => {
                        if (requestId !== requestRef.current) return;
                        console.error("Failed to fetch tag suggestions:", error);
                        setOptions([]);
                    });
        }, delay);
    }

    return (
            <Select
                    mode={"tags"}
                    value={value}
                    options={options}
                    tokenSeparators={[","]}
                    placeholder={placeholder}
                    aria-label={ariaLabel}
                    // the backend already filtered the suggestions by the typed text
                    showSearch={{filterOption: false, onSearch: typed => load(typed, debounceMs)}}
                    notFoundContent={null}
                    onOpenChange={open => {
                        if (open) load("", 0);
                    }}
                    onChange={next => onChange?.(next)}
                    data-testid="page-tags-input"
            />
    );
}
