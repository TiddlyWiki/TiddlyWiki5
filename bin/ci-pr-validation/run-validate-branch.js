#!/usr/bin/env node

/*
 * For standalone use outside of Github Actions
 *
 * Usage:
 * export GITHUB_PERSONAL_ACCESS_TOKEN=ghp_yourTokenHere
 * node run-validate-branch.js --pr 123 --repo yourname/yourrepo
 *
 * Requires: @octokit/rest
 *   npm install @octokit/rest --save-dev
*/

const { execSync } = require('child_process');
const path = require('path');
const https = require('https');

function parseArgs() {
	const args = process.argv.slice(2);
	const options = {};

	for(let i = 0; i < args.length; i++) {
		if(args[i].startsWith('--')) {
			const key = args[i].slice(2);
			const value = args[i+1];
			options[key] = value;
			i++;
		}
	}

	return options;
}

function fetchPRBase(repo, prNumber, token) {
	return new Promise((resolve, reject) => {
		const [owner, repoName] = repo.split('/');
		const options = {
			hostname: 'api.github.com',
			path: `/repos/${owner}/${repoName}/pulls/${prNumber}`,
			method: 'GET',
			headers: {
				'User-Agent': 'validate-pr-cli',
				'Authorization': `token ${token}`,
				'Accept': 'application/vnd.github.v3+json'
			}
		};

		const req = https.request(options, res => {
			let data = '';
			res.on('data', chunk => data += chunk);
			res.on('end', () => {
				if(res.statusCode >= 200 && res.statusCode < 300) {
					const pr = JSON.parse(data);
					resolve(pr.base.ref);
				} else {
					reject(new Error(`GitHub API responded with status ${res.statusCode}: ${data}`));
				}
			});
		});

		req.on('error', reject);
		req.end();
	});
}

(async () => {
	const options = parseArgs();
	const prNumber = options.pr;
	const repo = options.repo;
	const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

	if(!prNumber || !repo) {
		console.error('❌ Usage: node run-validate-branch.js --pr <number> --repo <owner/repo>');
		process.exit(1);
	}

	if(!token) {
		console.error('❌ GITHUB_PERSONAL_ACCESS_TOKEN environment variable is not set.');
		process.exit(1);
	}

	let baseRef;
	try {
		baseRef = await fetchPRBase(repo, prNumber, token);
		console.log(`ℹ️  Using base branch: ${baseRef}`);
	} catch(err) {
		console.error('❌ Failed to fetch base branch:', err.message);
		process.exit(1);
	}

	const scriptPath = 'validate-branch.js';

	execSync(`node ${scriptPath}`, {
		env: {
			...process.env,
			PR_NUMBER: prNumber,
			REPO: repo,
			BASE_REF: baseRef,
			GITHUB_PERSONAL_ACCESS_TOKEN: token
		},
		stdio: 'inherit'
	});
})();
