import {AutoComplete} from "antd";
import {useEffect, useRef, useState} from "react";
import {pageAPI} from "../services";

interface PagePathInputProps {
    /** Provided by Form.Item */
    value?: string;
    /** Provided by Form.Item */
    onChange?: (value: string) => void;
    placeholder?: string;
    /** Delay between the last keystroke and the suggestion request */
    debounceMs?: number;
}

export const PAGE_PATH_SUGGESTION_DEBOUNCE_MS = 250;

/**
 * Page path field with auto-completion from the existing pages: while typing, the backend answers with the parent path shared by every
 * readable page whose path starts with the typed text (the last path part is always dropped because paths are unique), and that
 * single suggestion is offered in the dropdown. Nothing is suggested when no page matches or the suggestion equals the typed text.
 */
export function PagePathInput({value, onChange, placeholder, debounceMs = PAGE_PATH_SUGGESTION_DEBOUNCE_MS}: PagePathInputProps) {
    const [options, setOptions] = useState<{ value: string }[]>([]);
    const requestRef = useRef(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => {
        if (timerRef.current !== null) clearTimeout(timerRef.current);
        // Drop answers of requests that are still in flight when the field unmounts
        requestRef.current++;
    }, []);

    function search(typed: string) {
        if (timerRef.current !== null) clearTimeout(timerRef.current);
        const requestId = ++requestRef.current;

        if (typed.trim() === "") {
            setOptions([]);
            return;
        }

        timerRef.current = setTimeout(() => {
            pageAPI.suggestPath(typed)
                    .then(response => {
                        if (requestId !== requestRef.current) return;
                        const suggestion = response.suggestion;
                        setOptions(suggestion && suggestion !== typed ? [{value: suggestion}] : []);
                    })
                    .catch(error => {
                        if (requestId !== requestRef.current) return;
                        console.error("Failed to fetch page path suggestion:", error);
                        setOptions([]);
                    });
        }, debounceMs);
    }

    return (
            <AutoComplete
                    value={value}
                    options={options}
                    onSearch={search}
                    onChange={next => onChange?.(next)}
                    placeholder={placeholder}
                    data-testid="page-path-input"
            />
    );
}
