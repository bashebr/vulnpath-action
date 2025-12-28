import { Ecosystem, Vulnerability } from './types';
export declare function getVulnerabilities(packageName: string, version: string, ecosystem: Ecosystem): Promise<Partial<Vulnerability>[]>;
