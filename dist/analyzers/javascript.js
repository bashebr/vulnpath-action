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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeJavascriptUsage = analyzeJavascriptUsage;
const fs = __importStar(require("fs"));
const glob_1 = require("glob");
const parser_1 = require("@babel/parser");
const traverse_1 = __importDefault(require("@babel/traverse"));
async function analyzeJavascriptUsage(packageName) {
    const files = (0, glob_1.globSync)('**/*.{js,jsx,ts,tsx,mjs,cjs}', {
        ignore: ['node_modules/**', 'dist/**', 'build/**', '.next/**', 'coverage/**']
    });
    const locations = [];
    let importCount = 0;
    let requireCount = 0;
    for (const file of files) {
        try {
            const code = fs.readFileSync(file, 'utf-8');
            // Quick pre-filter
            if (!code.includes(packageName))
                continue;
            const ast = (0, parser_1.parse)(code, {
                sourceType: 'unambiguous',
                plugins: ['jsx', 'typescript', 'decorators-legacy']
            });
            (0, traverse_1.default)(ast, {
                ImportDeclaration(path) {
                    const source = path.node.source.value;
                    if (source === packageName || source.startsWith(`${packageName}/`)) {
                        importCount++;
                        locations.push({
                            file,
                            line: path.node.loc?.start.line || 0,
                            type: 'import',
                            source,
                            specifiers: path.node.specifiers.map((s) => s.local.name)
                        });
                    }
                },
                CallExpression(path) {
                    if (path.node.callee.name === 'require') {
                        const arg = path.node.arguments[0];
                        if (arg?.value === packageName || arg?.value?.startsWith(`${packageName}/`)) {
                            requireCount++;
                            locations.push({
                                file,
                                line: path.node.loc?.start.line || 0,
                                type: 'require',
                                source: arg.value
                            });
                        }
                    }
                }
            });
        }
        catch (error) {
            // Ignore parse errors for specific files
        }
    }
    return {
        isUsed: locations.length > 0,
        importCount,
        requireCount,
        locations: locations.slice(0, 5),
        totalFilesScanned: files.length
    };
}
//# sourceMappingURL=javascript.js.map