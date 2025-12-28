import { scanRepository } from '../src/scanner';
import * as fs from 'fs';
import * as path from 'path';
import * as osvClient from '../src/osv-client';

jest.mock('../src/osv-client');
jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    existsSync: jest.fn(),
    readFileSync: jest.fn()
}));

describe('scanner integration', () => {
    const originalCwd = process.cwd();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should scan npm and Packagist ecosystems', async () => {
        (fs.existsSync as jest.Mock).mockImplementation((p: string) => {
            return p.endsWith('package.json') || p.endsWith('composer.json');
        });

        (fs.readFileSync as jest.Mock).mockImplementation((p: string) => {
            if (p.endsWith('package.json')) return JSON.stringify({ dependencies: { 'lodash': '4.17.20' } });
            if (p.endsWith('composer.json')) return JSON.stringify({ require: { 'guzzlehttp/guzzle': '7.4.5' } });
            return '';
        });

        (osvClient.getVulnerabilities as jest.Mock).mockResolvedValue([
            {
                id: 'GHSA-mock',
                summary: 'Mock vulnerability',
                severity: 'HIGH',
                packageName: 'lodash',
                version: '4.17.20'
            }
        ]);

        // Mock analyzer results for integration
        // We'll let the real analyzers run but we'll mock the files they scan
        // Actually, it's easier to mock the analyzer outputs if we wanted unit tests, 
        // but for integration we want to see it orchestrate.

        const results = await scanRepository();

        expect(results.vulnerabilities.length).toBeGreaterThan(0);
        // It should have called getVulnerabilities for both
        expect(osvClient.getVulnerabilities).toHaveBeenCalledWith('lodash', '4.17.20', 'npm');
        expect(osvClient.getVulnerabilities).toHaveBeenCalledWith('guzzlehttp/guzzle', '7.4.5', 'Packagist');
    });
});
