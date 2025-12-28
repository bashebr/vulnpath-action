"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzePhpUsage = analyzePhpUsage;
const fs = __importStar(require("fs"));
const glob_1 = require("glob");
async function analyzePhpUsage(packageName) {
    const files = (0, glob_1.globSync)('**/*.php', {
        ignore: ['vendor/**', 'tests/fixtures/**', 'dist/**']
    });
    const locations = [];
    const parts = packageName.split('/');
    const camelPart = (p) => p.charAt(0).toUpperCase() + p.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
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
                        if (locations.length >= 5)
                            break;
                    }
                }
            }
        }
        catch (error) {
            // Ignore
        }
        if (locations.length >= 5)
            break;
    }
    return {
        isUsed: locations.length > 0,
        importCount: locations.length,
        requireCount: 0,
        locations,
        totalFilesScanned: files.length
    };
}
//# sourceMappingURL=php.js.map