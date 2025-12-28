import { getOctokit } from '@actions/github';
import { ScanResult, Vulnerability } from './types';

export async function postComment({
    owner,
    repo,
    prNumber,
    githubToken,
    results
}: {
    owner: string;
    repo: string;
    prNumber: number;
    githubToken: string;
    results: ScanResult;
}) {
    const octokit = getOctokit(githubToken);
    const body = formatComment(results);

    const { data: comments } = await octokit.rest.issues.listComments({
        owner,
        repo,
        issue_number: prNumber
    });

    const existingComment = comments.find(c => c.body?.includes('VulnPath Package Security Scan'));

    if (existingComment) {
        await octokit.rest.issues.updateComment({
            owner,
            repo,
            comment_id: existingComment.id,
            body
        });
    } else {
        await octokit.rest.issues.createComment({
            owner,
            repo,
            issue_number: prNumber,
            body
        });
    }
}

function formatComment(results: ScanResult): string {
    const { vulnerabilities, packageUsed, packageUnused } = results;

    if (vulnerabilities.length === 0) {
        return `## ✅ VulnPath Package Security Scan\n\nNo vulnerabilities found! Your dependencies are clean. 🎉\n\n--- \n<sub>💡 VulnPath checks if vulnerable packages are **actually used** in your code</sub>`;
    }

    let comment = `## 🔒 VulnPath Package Security Scan\n\nFound **${vulnerabilities.length}** vulnerability(ies) in your dependencies.\n\n`;

    if (packageUsed.length > 0) {
        comment += `### 🚨 PACKAGE IN USE - Immediate Action Required (${packageUsed.length})\n\n`;
        for (const vuln of packageUsed) {
            comment += `#### ${getSeverityEmoji(vuln.severity)} ${vuln.cveId} - \`${vuln.packageName}\`\n`;
            comment += `- **Severity:** ${vuln.severity} (CVSS: ${vuln.cvssScore || 'N/A'})\n`;
            comment += `- **Summary:** ${vuln.summary}\n`;
            comment += `- **Used in:** ${vuln.usage.locations.length} known location(s)\n\n`;

            comment += `<details><summary>View Locations</summary>\n\n`;
            for (const loc of vuln.usage.locations) {
                comment += `- \`${loc.file}:${loc.line}\` (${loc.type})\n`;
            }
            comment += `</details>\n\n`;
        }
    }

    if (packageUnused.length > 0) {
        comment += `### ⚠️ PACKAGE INSTALLED BUT UNUSED - Low Priority (${packageUnused.length})\n\n`;
        for (const vuln of packageUnused) {
            comment += `- ${getSeverityEmoji(vuln.severity)} **${vuln.cveId}** - \`${vuln.packageName}\` (${vuln.severity})\n`;
        }
        comment += '\n';
    }

    comment += `---\n### 🎯 Recommendation\n\n`;
    if (packageUsed.length > 0) {
        comment += `**🚨 BLOCK MERGE** - ${packageUsed.length} vulnerable package(s) are actively used. Update them immediately.\n`;
    } else {
        comment += `✅ All vulnerable packages found are currently unused. Safe to proceed, but consider cleaning up.\n`;
    }

    return comment;
}

function getSeverityEmoji(severity: string): string {
    const s = severity.toUpperCase();
    if (s.includes('CRITICAL')) return '🔴';
    if (s.includes('HIGH')) return '🟠';
    if (s.includes('MEDIUM')) return '🟡';
    return '🟢';
}
