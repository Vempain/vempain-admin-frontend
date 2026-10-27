// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

if (!globalThis.TextEncoder) {
    Object.defineProperty(globalThis, 'TextEncoder', {
        configurable: true,
        value: class {
            readonly encoding = 'utf-8';

            encode(input = '') {
                // UTF-8 bytes from the percent-encoded form (the legacy unescape() helper is deprecated)
                const encoded = encodeURIComponent(input);
                const bytes: number[] = [];
                for (let index = 0; index < encoded.length; index++) {
                    if (encoded[index] === '%') {
                        bytes.push(parseInt(encoded.slice(index + 1, index + 3), 16));
                        index += 2;
                    } else {
                        bytes.push(encoded.charCodeAt(index));
                    }
                }
                return Uint8Array.from(bytes);
            }
        },
    });
}

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

const originalGetComputedStyle = window.getComputedStyle;
const getComputedStyleWithoutPseudoElement = (element: Element, _pseudoElt?: string | null) => originalGetComputedStyle(element);

window.getComputedStyle = getComputedStyleWithoutPseudoElement;
Object.defineProperty(globalThis, 'getComputedStyle', {
    configurable: true,
    value: getComputedStyleWithoutPseudoElement,
});

// antd form fields schedule work through MessageChannel, which jsdom does not provide
if (typeof globalThis.MessageChannel === 'undefined') {
    class StubMessageChannel {
        port1: { onmessage: ((event: { data: unknown }) => void) | null; postMessage: (data: unknown) => void };
        port2: { onmessage: ((event: { data: unknown }) => void) | null; postMessage: (data: unknown) => void };

        constructor() {
            this.port1 = {onmessage: null, postMessage: data => queueMicrotask(() => this.port2.onmessage?.({data}))};
            this.port2 = {onmessage: null, postMessage: data => queueMicrotask(() => this.port1.onmessage?.({data}))};
        }
    }

    Object.defineProperty(globalThis, 'MessageChannel', {configurable: true, writable: true, value: StubMessageChannel});
}

// antd dropdowns observe their trigger size; jsdom has no ResizeObserver
if (typeof globalThis.ResizeObserver === 'undefined') {
    class StubResizeObserver {
        observe(): void {
        }

        unobserve(): void {
        }

        disconnect(): void {
        }
    }

    Object.defineProperty(globalThis, 'ResizeObserver', {configurable: true, writable: true, value: StubResizeObserver});
}

// Vite environment of the services and screens; `import.meta.env` is rewritten to `process.env` by jest/importMetaTransformer.cjs
// (read through globalThis so that this file also compiles under the browser-only application tsconfig)
const testEnv = (globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env;
testEnv.VITE_APP_API_URL ??= "http://localhost:8080/api";
testEnv.VITE_APP_FILE_URL ??= "http://localhost:8080/files";
testEnv.VITE_APP_VEMPAIN_COPYRIGHT_FOOTER ??= "Vempain project © 2024-2025";
testEnv.VITE_APP_POWERED_BY_VEMPAIN ??= "Powered by <a href=\"https://vempain.poltsi.fi/\">Vempain System</a>";
