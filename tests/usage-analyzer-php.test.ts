import * as fs from 'fs';
import { analyzePhpUsage } from '../src/analyzers/php';

jest.mock('fs');
jest.mock('glob', () => ({
    globSync: jest.fn().mockReturnValue(['test.php'])
}));

describe('php analyzer', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should detect namespace usage via "use" statement', async () => {
        const code = "<?php\nuse GuzzleHttp\\Client;\n$client = new Client();";
        (fs.readFileSync as jest.Mock).mockReturnValue(code);

        const usage = await analyzePhpUsage('guzzlehttp/guzzle');

        expect(usage.isUsed).toBe(true);
        expect(usage.locations[0].file).toBe('test.php');
    });

    it('should detect fully qualified static usage', async () => {
        const code = "<?php\n\\GuzzleHttp\\Client::post();";
        (fs.readFileSync as jest.Mock).mockReturnValue(code);

        const usage = await analyzePhpUsage('guzzlehttp/guzzle');

        expect(usage.isUsed).toBe(true);
    });

    it('should handle hyphenated package names strictly matching Vendor\\Package', async () => {
        // vendor/some-package -> Vendor\SomePackage
        const code = "<?php\nuse Vendor\\SomePackage\\Class;";
        (fs.readFileSync as jest.Mock).mockReturnValue(code);

        const usage = await analyzePhpUsage('vendor/some-package');
        expect(usage.isUsed).toBe(true);
    });
});
