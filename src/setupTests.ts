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
                return Uint8Array.from(unescape(encodeURIComponent(input)), (character) => character.charCodeAt(0));
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
            this.port1 = {onmessage: null, postMessage: data => setTimeout(() => this.port2.onmessage?.({data}), 0)};
            this.port2 = {onmessage: null, postMessage: data => setTimeout(() => this.port1.onmessage?.({data}), 0)};
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
