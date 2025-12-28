import { Ecosystem, Vulnerability } from './types';

export async function getVulnerabilities(
    packageName: string,
    version: string,
    ecosystem: Ecosystem
): Promise<Partial<Vulnerability>[]> {
    try {
        const osvUrl = 'https://api.osv.dev/v1/query';

        // Clean version (remove ^, ~, etc.)
        const cleanVersion = version.replace(/^[\^~]/, '');

        const response = await fetch(osvUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                package: {
                    name: packageName,
                    ecosystem: ecosystem === 'npm' ? 'npm' : 'Packagist'
                },
                version: cleanVersion
            })
        });

        if (!response.ok) return [];

        const data: any = await response.json();

        if (!data.vulns || !Array.isArray(data.vulns) || data.vulns.length === 0) return [];

        return data.vulns.map((vuln: any) => ({
            cveId: vuln.id,
            summary: vuln.summary || 'No description available',
            severity: extractSeverity(vuln),
            cvssScore: extractCVSS(vuln),
            references: vuln.references || [],
            publishedDate: vuln.published,
            modifiedDate: vuln.modified,
            packageName,
            version
        }));

    } catch (error: any) {
        console.error(`Error fetching vulnerabilities for ${packageName}:`, error.message);
        return [];
    }
}

function extractSeverity(vuln: any): string {
    if (vuln.severity) {
        if (Array.isArray(vuln.severity)) {
            return vuln.severity[0]?.type || 'UNKNOWN';
        }
        return vuln.severity.type || 'UNKNOWN';
    }

    if (vuln.database_specific?.severity) {
        return vuln.database_specific.severity;
    }

    return 'UNKNOWN';
}

function extractCVSS(vuln: any): number | null {
    if (vuln.severity && Array.isArray(vuln.severity)) {
        for (const sev of vuln.severity) {
            if (sev.score) return parseFloat(sev.score);
        }
    }

    if (vuln.database_specific?.cvss_score) {
        return parseFloat(vuln.database_specific.cvss_score);
    }

    return null;
}
