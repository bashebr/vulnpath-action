import { getVulnerabilities } from '../src/osv-client';

describe('osv-client', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        jest.clearAllMocks();
        // In Node 20, fetch is on global
        global.fetch = jest.fn() as jest.Mock;
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    it('should format clean version and call OSV API', async () => {
        const mockResponse = {
            ok: true,
            json: async () => ({
                vulns: [
                    {
                        id: 'GHSA-mock-1',
                        summary: 'Mock vulnerability',
                        severity: [{ type: 'CVSS_V3', score: '7.5' }],
                        published: '2023-01-01',
                        modified: '2023-01-02'
                    }
                ]
            })
        };
        (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

        const results = await getVulnerabilities('lodash', '^4.17.20', 'npm');

        expect(results).toHaveLength(1);
        expect(results[0].cveId).toBe('GHSA-mock-1');
        expect(results[0].cvssScore).toBe(7.5);
        expect(global.fetch).toHaveBeenCalledWith(
            'https://api.osv.dev/v1/query',
            expect.objectContaining({
                body: JSON.stringify({
                    package: { name: 'lodash', ecosystem: 'npm' },
                    version: '4.17.20'
                })
            })
        );
    });

    it('should handle empty vulnerabilities', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({})
        });

        const results = await getVulnerabilities('lodash', '4.17.21', 'npm');
        expect(results).toHaveLength(0);
    });
});
