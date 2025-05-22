"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debounce = debounce;
function debounce(fn, delay) {
    let timeoutId;
    const debouncedFn = function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
    debouncedFn.cancel = () => clearTimeout(timeoutId);
    return debouncedFn;
}
