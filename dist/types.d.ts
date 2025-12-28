export type Ecosystem = 'npm' | 'Packagist';
export interface Vulnerability {
    cveId: string;
    summary: string;
    severity: string;
    cvssScore: number | null;
    references: {
        type: string;
        url: string;
    }[];
    publishedDate: string;
    modifiedDate: string;
    packageName: string;
    version: string;
    usage: PackageUsage;
}
export interface PackageUsage {
    isUsed: boolean;
    importCount: number;
    requireCount: number;
    locations: ImportLocation[];
    totalFilesScanned: number;
}
export interface ImportLocation {
    file: string;
    line: number;
    type: string;
    source: string;
    specifiers?: string[];
}
export interface ScanResult {
    vulnerabilities: Vulnerability[];
    packageUsed: Vulnerability[];
    packageUnused: Vulnerability[];
}
