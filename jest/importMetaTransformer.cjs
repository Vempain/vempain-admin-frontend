/* eslint-disable no-undef */
/**
 * ts-jest AST transformer: rewrites `import.meta.env` to `process.env` so that the Vite-style environment access of the
 * services and screens compiles under the CommonJS test runtime. `src/setupTests.ts` provides the VITE_* defaults.
 *
 * Remember to bump `version` whenever this file changes, so that Jest does not reuse a stale transform cache.
 */
const version = 1;
const name = 'import-meta-env';

function factory({configSet}) {
    const ts = configSet.compilerModule;

    return (context) => (sourceFile) => {
        const visitor = (node) => {
            if (ts.isPropertyAccessExpression(node)
                && ts.isMetaProperty(node.expression)
                && node.expression.keywordToken === ts.SyntaxKind.ImportKeyword
                && node.name.text === 'env') {
                return context.factory.createPropertyAccessExpression(context.factory.createIdentifier('process'), 'env');
            }
            return ts.visitEachChild(node, visitor, context);
        };
        return ts.visitNode(sourceFile, visitor);
    };
}

module.exports = {version, name, factory};
