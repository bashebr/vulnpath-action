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
exports.scanRepository = scanRepository;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const osv_client_1 = require("./osv-client");
const javascript_1 = require("./analyzers/javascript");
const php_1 = require("./analyzers/php");
async function scanRepository(excludeDev = false) {
    const results = {
        vulnerabilities: [],
        packageUsed: [],
        packageUnused: []
    };
    // 1. Scan Node.js (package.json)
    await scanEcosystem('package.json', 'npm', javascript_1.analyzeJavascriptUsage, results, excludeDev);
    // 2. Scan PHP (composer.json)
    await scanEcosystem('composer.json', 'Packagist', php_1.analyzePhpUsage, results, excludeDev);
    return results;
}
async function scanEcosystem(manifestFile, ecosystem, analyzer, results, excludeDev) {
    const manifestPath = path.join(process.cwd(), manifestFile);
    if (!fs.existsSync(manifestPath))
        return;
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
        if (typeof version !== 'string')
            continue;
        const vulns = await (0, osv_client_1.getVulnerabilities)(packageName, version, ecosystem);
        for (const vulnData of vulns) {
            const usage = await analyzer(packageName);
            const fullVuln = {
                ...vulnData,
                usage
            };
            results.vulnerabilities.push(fullVuln);
            if (usage.isUsed) {
                results.packageUsed.push(fullVuln);
            }
            else {
                results.packageUnused.push(fullVuln);
            }
        }
    }
}
//# sourceMappingURL=scanner.js.map