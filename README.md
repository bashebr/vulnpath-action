# 🔒 VulnPath GitHub Action

> **Know if vulnerable packages are actually used in your code.**  
> Supports Node.js (npm/pnpm/yarn) and PHP (Composer).

## Why VulnPath?

Dependabot alerts you to vulnerabilities, but it doesn't tell you if you're actually importing the affected package. VulnPath analyzes your code to determine if a vulnerable dependency is actively used, helping you prioritize high-risk security fixes.

## Features

- ✅ **Multi-Ecosystem**: Scans both `package.json` and `composer.json`.
- 🔍 **Usage Analysis**: Parses JS/TS (AST) and PHP (Regex) to detect imports/namespaces.
- 💬 **Actionable PR Comments**: Posts clear results indicating what is **IN USE** and what is **UNUSED**.
- 🚀 **Zero Config**: Works out of the box with reasonable defaults.

## Usage

Add this to your `.github/workflows/security.yml`:

```yaml
name: Security Scan
on: [pull_request]

jobs:
  vulnpath:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: VulnPath Scan
        uses: vulnpath/vulnpath-action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `github-token` | GitHub token for posting PR comments | `${{ github.token }}` |
| `fail-on-vulnerability` | Fail the action if used vulnerable packages are found | `true` |
| `exclude-dev-dependencies` | Skip devDependencies in the scan | `false` |

## How it works

1. **Scans dependencies**: Checks vs the [OSV.dev](https://osv.dev) database.
2. **Analyzes imports**:
   - **JS/TS**: Uses Babel to parse code for `import` and `require`.
   - **PHP**: Scans for `use` statements and fully-qualified class usage.
3. **Reports**: Categorizes findings and posts a report to the PR.

## Limitations

- **Package Level**: Detects if the package is imported, not if specific vulnerable functions are called.
- **PHP Heuristic**: Uses namespace detection based on common Composer naming conventions.

---
MIT License © VulnPath
