/**
 * This script validates pull requests based on specific conditions:
 * - If the PR targets the 'tiddlywiki-com' branch, it ensures all files are inside the '/editions' folder.
 * - If the PR targets the 'master' branch, it checks if the PR only modifies documentation within the '/editions' folder.
 * 
 * Environment variables needed:
 * - `GITHUB_TOKEN` (GitHub Actions only): GitHub token to authenticate with GitHub's REST API. Set as a secret in GitHub Actions.
 * - `GITHUB_PERSONAL_ACCESS_TOKEN` (for local/standalone execution): Personal access token for GitHub API to authenticate requests.
 * - `PR_NUMBER`: The pull request number to validate.
 * - `REPO`: The repository in the format "owner/repo". This is used to determine which repo to validate.
 * - `BASE_REF`: The base branch of the pull request. This can be used to check the target branch (e.g., `tiddlywiki-com` or `master`).
 *
 * **Usage in GitHub Actions**:
 * - GitHub Actions automatically provides the `GITHUB_TOKEN` for authentication and passes the PR number, repository, and base ref through the workflow.
 * 
 * **Usage outside of GitHub Actions**:
 * - You need to provide a GitHub Personal Access Token (`GITHUB_PERSONAL_ACCESS_TOKEN`) and set the necessary environment variables.
 *
 * @example
 * // Running the script outside of GitHub Actions
 * // 1. Create a .env file with the following content:
 * //    GITHUB_PERSONAL_ACCESS_TOKEN=your_personal_access_token_here
 * //    PR_NUMBER=42
 * //    REPO=my-user/my-repo
 * //    BASE_REF=tiddlywiki-com
 * 
 * // 2. Run the script in your terminal:
 * node validate-pr.js
 */

const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
const PRCommentUtils = require('./pr-comment-utils');

const ERROR_TAG = "<!-- editions-folder-error -->";
const WARNING_TAG = "<!-- editions-folder-warning -->";

const ERROR_MESSAGE = `${ERROR_TAG}
❌ **Error**: PRs targeting the \`tiddlywiki-com\` branch must not contain any files outside the \`/editions\` folder.`;

const WARNING_MESSAGE = `${WARNING_TAG}
⚠️ **Warning**: This PR only modifies documentation (within \`/editions\`). If the changes do not relate to the prerelease, please consider targeting the \`master\` branch instead.`;

async function run() {
	let octokit;
	let core;

	try {
		if(isGitHubActions) {
			core = require('@actions/core');
			const github = require('@actions/github');
			octokit = github.getOctokit(process.env.GITHUB_TOKEN);
		} else {
			const { Octokit } = await import('@octokit/rest');
			const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
			octokit = new Octokit({ auth: token });
		}

		const prNumber = parseInt(process.env.PR_NUMBER, 10);
		const repo = process.env.REPO;
		const baseRef = process.env.BASE_REF;
		const [owner, repoName] = repo.split('/');

		const utils = new PRCommentUtils(octokit);
		const changedFiles = await utils.getChangedFiles(owner, repoName, prNumber);

		let messageToPost = '';

		// Skip PRs that only modify a license file
		if(changedFiles.length === 1 && changedFiles[0].startsWith("licenses/")) {
			return;
		}

		if(baseRef === 'tiddlywiki-com') {
			const allInEditions = changedFiles.every(file => file.startsWith('editions/'));
			if(!allInEditions) {
				messageToPost = ERROR_MESSAGE;
			}
		} else if(baseRef === 'master') {
			const allInEditions = changedFiles.every(file => file.startsWith('editions/'));
			if(allInEditions) {
				messageToPost = WARNING_MESSAGE;
			}
		}

		const existingError = await utils.getExistingComment(owner, repoName, prNumber, ERROR_TAG);
		if(existingError) {
			await utils.deleteComment(owner, repoName, prNumber, existingError.id);
		}

		const existingWarning = await utils.getExistingComment(owner, repoName, prNumber, WARNING_TAG);
		if(existingWarning) {
			await utils.deleteComment(owner, repoName, prNumber, existingWarning.id);
		}

		if(messageToPost) {
			await utils.postComment(owner, repoName, prNumber, messageToPost);
		}
	} catch (err) {
		if (core) {
			core.setFailed(`Action failed: ${err.message}`);
		} else {
			console.error(`Validation failed: ${err.message}`);
			process.exit(1);
		}
	}
}

run();
