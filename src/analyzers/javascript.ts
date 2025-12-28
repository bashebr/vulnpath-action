import * as fs from 'fs';
import { globSync } from 'glob';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { PackageUsage, ImportLocation } from '../types';

export async function analyzeJavascriptUsage(packageName: string): Promise<PackageUsage> {
    const files = globSync('**/*.{js,jsx,ts,tsx,mjs,cjs}', {
        ignore: ['node_modules/**', 'dist/**', 'build/**', '.next/**', 'coverage/**']
    });

    const locations: ImportLocation[] = [];
    let importCount = 0;
    let requireCount = 0;

    for (const file of files) {
        try {
            const code = fs.readFileSync(file, 'utf-8');

            // Quick pre-filter
            if (!code.includes(packageName)) continue;

            const ast = parse(code, {
                sourceType: 'unambiguous',
                plugins: ['jsx', 'typescript', 'decorators-legacy']
            });

            traverse(ast, {
                ImportDeclaration(path) {
                    const source = path.node.source.value;
                    if (source === packageName || source.startsWith(`${packageName}/`)) {
                        importCount++;
                        locations.push({
                            file,
                            line: path.node.loc?.start.line || 0,
                            type: 'import',
                            source,
                            specifiers: path.node.specifiers.map((s: any) => s.local.name)
                        });
                    }
                },
                CallExpression(path: any) {
                    if (path.node.callee.name === 'require') {
                        const arg = path.node.arguments[0];
                        if (arg?.value === packageName || arg?.value?.startsWith(`${packageName}/`)) {
                            requireCount++;
                            locations.push({
                                file,
                                line: path.node.loc?.start.line || 0,
                                type: 'require',
                                source: arg.value
                            });
                        }
                    }
                }
            });
        } catch (error) {
            // Ignore parse errors for specific files
        }
    }

    return {
        isUsed: locations.length > 0,
        importCount,
        requireCount,
        locations: locations.slice(0, 5),
        totalFilesScanned: files.length
    };
}
