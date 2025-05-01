
class PRCommentUtils {
	/**
	 * Creates an instance of PRCommentUtils.
	 *
	 * @param {Object} octokit - The Octokit instance to interact with GitHub API.
	 */
	constructor(octokit) {
		this.octokit = octokit;
	}
  
	/**
	 * Retrieves the list of changed files in a pull request.
	 *
	 * @param {string} owner - The repository owner's username.
	 * @param {string} repoName - The repository name.
	 * @param {number} prNumber - The pull request number.
	 * @returns {Promise<string[]>} A list of changed filenames.
	 */
	async getChangedFiles(owner, repoName, prNumber) {
		const { data } = await this.octokit.rest.pulls.listFiles({
			owner,
			repo: repoName,
			pull_number: prNumber,
		});
		
		return data.map(file => file.filename);
	}
  
	/**
	 * Posts or updates a comment on the pull request based on a specific tag.
	 *
	 * @param {Object} params - The parameters for posting/updating the comment.
	 * @param {number} params.prNumber - The pull request number.
	 * @param {string} params.repo - The repository in the format "owner/repo".
	 * @param {string} params.tag - The tag used to identify the comment.
	 * @param {string} params.message - The comment body.
	 * @returns {Promise<void>} A promise that resolves once the comment operation is complete.
	 */
	async postOrUpdateComment({ prNumber, repo, tag, message}) {
		const [owner, repoName] = repo.split('/');

		// Check if the comment with the specific tag already exists
		const existingComment = await this.getExistingComment(owner, repoName, prNumber, tag);

		if(existingComment) {
			// If the comment exists, update it
			const commentId = existingComment.id;
			await this.updateComment(owner, repoName, prNumber, commentId, message);
		} else {
			// If the comment doesn't exist, post a new one
			await this.postComment(owner, repoName, prNumber, message);
		}
	}
  
	/**
	 * Retrieves an existing comment on a pull request based on a specific tag.
	 *
	 * @param {string} owner - The repository owner's username.
	 * @param {string} repoName - The repository name.
	 * @param {number} prNumber - The pull request number.
	 * @param {string} tag - The tag used to identify the comment.
	 * @returns {Promise<Object|null>} A comment object if found, or null.
	 */
	async getExistingComment(owner, repoName, prNumber, tag) {
		const { data: comments } = await this.octokit.rest.issues.listComments({
			owner,
			repo: repoName,
			issue_number: prNumber,
		});
	
		return comments.find(comment => comment.body.startsWith(tag)) || null;
	}
  
	/**
	 * Posts a new comment on a pull request.
	 *
	 * @param {string} owner - The repository owner's username.
	 * @param {string} repoName - The repository name.
	 * @param {number} prNumber - The pull request number.
	 * @param {string} message - The comment body.
	 * @returns {Promise<void>} A promise that resolves once the comment is posted.
	 */
	async postComment(owner, repoName, prNumber, message) {
		await this.octokit.rest.issues.createComment({
			owner,
			repo: repoName,
			issue_number: prNumber,
			body: message,
		});
	}
  
	/**
	 * Updates an existing comment on a pull request.
	 *
	 * @param {string} owner - The repository owner's username.
	 * @param {string} repoName - The repository name.
	 * @param {number} prNumber - The pull request number.
	 * @param {number} commentId - The comment ID to update.
	 * @param {string} message - The updated comment body.
	 * @returns {Promise<void>} A promise that resolves once the comment is updated.
	 */
	async updateComment(owner, repoName, prNumber, commentId, message) {
		await this.octokit.rest.issues.updateComment({
			owner,
			repo: repoName,
			comment_id: commentId,
			body: message,
		});
	}
  
	/**
	 * Deletes a comment from a pull request.
	 *
	 * @param {string} owner - The repository owner's username.
	 * @param {string} repoName - The repository name.
	 * @param {number} prNumber - The pull request number.
	 * @param {number} commentId - The comment ID to delete.
	 * @returns {Promise<void>} A promise that resolves once the comment is deleted.
	 */
	async deleteComment(owner, repoName, prNumber, commentId) {
		await this.octokit.rest.issues.deleteComment({
			owner,
			repo: repoName,
			comment_id: commentId,
		});
	}
}

module.exports = PRCommentUtils;
