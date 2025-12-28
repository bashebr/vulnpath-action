import * as core from '@actions/core';
import * as github from '@actions/github';
import { scanRepository } from './scanner';
import { postComment } from './github-utils';

async function run() {
    try {
        const githubToken = core.getInput('github-token');
        const failOnVuln = core.getInput('fail-on-vulnerability') === 'true';
        const excludeDev = core.getInput('exclude-dev-dependencies') === 'true';

        const context = github.context;
        const { owner, repo } = context.repo;
        const prNumber = context.payload.pull_request?.number;

        if (!prNumber) {
            core.info('This action only works on pull requests. Skipping scan.');
            return;
        }

        core.info(`🔍 VulnPath: Scanning ${owner}/${repo} PR #${prNumber}...`);

        const results = await scanRepository(excludeDev);

        core.info(`📊 Scan Results:
- Total Vulnerabilities: ${results.vulnerabilities.length}
- Packages in use: ${results.packageUsed.length}
- Packages unused: ${results.packageUnused.length}
`);

        await postComment({
            owner,
            repo,
            prNumber,
            githubToken,
            results
        });

        core.setOutput('vulnerabilities-found', results.vulnerabilities.length);
        core.setOutput('critical-count', results.packageUsed.length);

        if (failOnVuln && results.packageUsed.length > 0) {
            core.setFailed(`🚨 Found ${results.packageUsed.length} vulnerable package(s) actively used in your code.`);
        }

        core.info('✅ VulnPath: Scan complete!');

    } catch (error: any) {
        core.setFailed(`❌ VulnPath Error: ${error.message}`);
    }
}

run();
