// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

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
