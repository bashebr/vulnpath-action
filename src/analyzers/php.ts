import * as fs from 'fs';
import { globSync } from 'glob';
import { PackageUsage, ImportLocation } from '../types';

export async function analyzePhpUsage(packageName: string): Promise<PackageUsage> {
    const files = globSync('**/*.php', {
        ignore: ['vendor/**', 'tests/fixtures/**', 'dist/**']
    });

    const locations: ImportLocation[] = [];

    const parts = packageName.split('/');
    const camelPart = (p: string) => p.charAt(0).toUpperCase() + p.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase());

    const vendor = camelPart(parts[0]);
    const pkg = parts[1] ? camelPart(parts[1]) : '';

    const fullNamespace = pkg ? `${vendor}\\\\${pkg}` : vendor;
    const vendorNamespace = vendor;

    for (const file of files) {
        try {
            const code = fs.readFileSync(file, 'utf-8');

            const useRegex = new RegExp(`use\\s+${fullNamespace}|use\\s+${vendorNamespace}`, 'i');
            const staticRegex = new RegExp(`${fullNamespace}\\\\|${vendorNamespace}\\\\`, 'i');

            if (useRegex.test(code) || staticRegex.test(code)) {
                const lines = code.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    if (useRegex.test(lines[i]) || staticRegex.test(lines[i])) {
                        locations.push({
                            file,
                            line: i + 1,
                            type: 'php-usage',
                            source: packageName
                        });
                        if (locations.length >= 5) break;
                    }
                }
            }
        } catch (error) {
            // Ignore
        }
        if (locations.length >= 5) break;
    }

    return {
        isUsed: locations.length > 0,
        importCount: locations.length,
        requireCount: 0,
        locations,
        totalFilesScanned: files.length
    };
}
