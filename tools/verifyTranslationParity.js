#!/usr/bin/env node
/**
 * Verify that de.json, en.json, es.json, fi.json, sv.json contain identical translation keys.
 * Checks:
 *  - Every key path exists in every file.
 *  - Type consistency (object vs non-object) for each path.
 * Exit code:
 *  - 0 if all match.
 *  - 1 if discrepancies found.
 */

const fs = require('fs');
const path = require('path');

const files = [
    'public/locales/de.json',
    'public/locales/en.json',
    'public/locales/es.json',
    'public/locales/fi.json',
    'public/locales/sv.json'
];

function isPlainObject(v) {
    return v && typeof v === 'object' && !Array.isArray(v);
}

function collectKeys(obj, prefix = '', out = new Map()) {
    // Record the current node type (only if prefix not empty)
    if (prefix) {
        const type = isPlainObject(obj) ? 'object' : 'value';
        out.set(prefix, type);
    }

    // If it's an object, recurse into all its properties
    if (isPlainObject(obj)) {
        for (const [key, value] of Object.entries(obj)) {
            const newPrefix = prefix ? `${prefix}.${key}` : key;
            collectKeys(value, newPrefix, out);
        }
    }

    return out;
}

function compareKeys() {
    const fileKeys = new Map();
    const allKeys = new Set();
    let hasErrors = false;

    // Load all files and collect their keys
    for (const filePath of files) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(content);
            const keys = collectKeys(data);
            fileKeys.set(filePath, keys);

            // Add all keys to the master set
            for (const key of keys.keys()) {
                allKeys.add(key);
            }
        } catch (error) {
            console.error(`Error processing ${filePath}:`, error.message);
            process.exit(1);
        }
    }

    // Check each file against all keys
    for (const filePath of files) {
        const keys = fileKeys.get(filePath);
        const fileName = path.basename(filePath);
        const missingKeys = [];
        const typeErrors = [];

        for (const key of allKeys) {
            if (!keys.has(key)) {
                missingKeys.push(key);
                hasErrors = true;
            } else {
                // Check type consistency
                const keyType = keys.get(key);
                const referenceType = fileKeys.get(files[0]).get(key);

                if (keyType !== referenceType) {
                    typeErrors.push({key, expected: referenceType, actual: keyType});
                    hasErrors = true;
                }
            }
        }

        // Report missing keys
        if (missingKeys.length > 0) {
            console.error(`\x1b[31m${fileName} is missing the following keys:\x1b[0m`);
            missingKeys.forEach(key => console.error(`  - ${key}`));
        }

        // Report type mismatches
        if (typeErrors.length > 0) {
            console.error(`\x1b[31m${fileName} has type mismatches:\x1b[0m`);
            typeErrors.forEach(({key, expected, actual}) => {
                console.error(`  - ${key}: expected ${expected}, got ${actual}`);
            });
        }
    }

    return hasErrors;
}

// Run the comparison
const hasErrors = compareKeys();

if (hasErrors) {
    console.error('\x1b[31mDiscrepancies found in translation files.\x1b[0m');
    process.exit(1);
} else {
    console.log('\x1b[32mAll translation files have matching keys.\x1b[0m');
    process.exit(0);
}
