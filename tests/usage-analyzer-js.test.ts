import * as fs from 'fs';
import { analyzeJavascriptUsage } from '../src/analyzers/javascript';

jest.mock('fs');
jest.mock('glob', () => ({
    globSync: jest.fn().mockReturnValue(['test.js'])
}));

describe('javascript analyzer', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should detect ES6 imports', async () => {
        const code = "import { get } from 'lodash';\nconsole.log(get({a: 1}, 'a'));";
        (fs.readFileSync as jest.Mock).mockReturnValue(code);

        const usage = await analyzeJavascriptUsage('lodash');

        expect(usage.isUsed).toBe(true);
        expect(usage.importCount).toBe(1);
        expect(usage.locations[0].type).toBe('import');
    });

    it('should detect CommonJS require', async () => {
        const code = "const _ = require('lodash');";
        (fs.readFileSync as jest.Mock).mockReturnValue(code);

        const usage = await analyzeJavascriptUsage('lodash');

        expect(usage.isUsed).toBe(true);
        expect(usage.requireCount).toBe(1);
    });

    it('should not detect unrelated imports', async () => {
        const code = "import { foo } from 'bar';";
        (fs.readFileSync as jest.Mock).mockReturnValue(code);

        const usage = await analyzeJavascriptUsage('lodash');

        expect(usage.isUsed).toBe(false);
    });
});
