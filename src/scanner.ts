import * as fs from 'fs';
import * as path from 'path';
import { getVulnerabilities } from './osv-client';
import { analyzeJavascriptUsage } from './analyzers/javascript';
import { analyzePhpUsage } from './analyzers/php';
import { ScanResult, Vulnerability, Ecosystem, PackageUsage } from './types';

export async function scanRepository(excludeDev: boolean = false): Promise<ScanResult> {
    const results: ScanResult = {
        vulnerabilities: [],
        packageUsed: [],
        packageUnused: []
    };

    // 1. Scan Node.js (package.json)
    await scanEcosystem(
        'package.json',
        'npm',
        analyzeJavascriptUsage,
        results,
        excludeDev
    );

    // 2. Scan PHP (composer.json)
    await scanEcosystem(
        'composer.json',
        'Packagist',
        analyzePhpUsage,
        results,
        excludeDev
    );

    return results;
}

async function scanEcosystem(
    manifestFile: string,
    ecosystem: Ecosystem,
    analyzer: (pkg: string) => Promise<PackageUsage>,
    results: ScanResult,
    excludeDev: boolean
) {
    const manifestPath = path.join(process.cwd(), manifestFile);
    if (!fs.existsSync(manifestPath)) return;

    const content = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const dependencies = {
        ...content.dependencies,
        ...(excludeDev ? {} : content['devDependencies'] || content['require-dev'] || {})
    };

    // Also handle PHP "require"
    if (ecosystem === 'Packagist') {
        Object.assign(dependencies, content.require || {});
    }

    for (const [packageName, version] of Object.entries(dependencies)) {
        if (typeof version !== 'string') continue;

        const vulns = await getVulnerabilities(packageName, version, ecosystem);

        for (const vulnData of vulns) {
            const usage = await analyzer(packageName);
            const fullVuln: Vulnerability = {
                ...vulnData as any,
                usage
            };

            results.vulnerabilities.push(fullVuln);
            if (usage.isUsed) {
                results.packageUsed.push(fullVuln);
            } else {
                results.packageUnused.push(fullVuln);
            }
        }
    }
}
