import { NetlifyIntegration } from "@netlify/sdk";
import { getProperties } from "./getProperties";

const integration = new NetlifyIntegration();
const MUT_VERSION = "0.11.4";

integration.addBuildEventHandler(
	"onSuccess",
	async ({ utils: { status, git, run }, netlifyConfig }) => {
		console.log("Checking if any files changed on git -----");
		console.log("Modified files:", git.modifiedFiles);

		//TODO: change these teamwide env vars in Netlify UI when ready to move to prod
		process.env.AWS_SECRET_ACCESS_KEY = process.env.AWS_S3_SECRET_ACCESS_KEY;
		process.env.AWS_ACCESS_KEY_ID = process.env.AWS_S3_ACCESS_KEY_ID;

		if (!process.env.DEPLOY_PRIME_URL) {
			console.error("ERROR! process.env.DEPLOY_PRIME_URL is not defined.");
			return;
		}

		const markdownList = createMarkdown(
			git.modifiedFiles,
			process.env.DEPLOY_PRIME_URL,
		);

		if (markdownList.length !== 0) {
			status.show({
				title: "URLs to Changed Files",
				summary: markdownList.join("\n"),
			});
		}

		// new functionalilty that should be moved ==========================================================
		console.log("start of the mut-publish plugin -----------");

		// accessing repo name
		const repoName =
			process.env.REPO_NAME ?? netlifyConfig.build.environment.SITE_NAME;
		if (!repoName) {
			throw new Error(
				"No repo name supplied as environment variable, manifest cannot be uploaded to Atlas Search.Documents collection ",
			);
		}
		console.log("repo name is:", repoName);

		// connect to mongodb and pool.docsets to get bucket
		const docsetEntry = await getProperties(repoName);
		console.log("Succesfully got docsets entry:", docsetEntry);

		// download mut
		console.log("Downloading Mut...");
		await run("curl", [
			"-L",
			"-o",
			"mut.zip",
			`https://github.com/mongodb/mut/releases/download/v${MUT_VERSION}/mut-v${MUT_VERSION}-linux_x86_64.zip`,
		]);
		await run.command("unzip -d . -qq mut.zip");

		/*Usage: mut-publish <source> <bucket> --prefix=prefix
                      (--stage|--deploy)
                      [--all-subdirectories]
                      [--redirects=htaccess]
                      [--deployed-url-prefix=prefix]
                      [--redirect-prefix=prefix]...
                      [--dry-run] [--verbose] [--json] */
		try {
			console.log("Running mut-publish...");
			// TODO: do I need to log this command below
			// TODO: "do I need to change the prefix to be: docsEntry.prefix.dotcomstg, or do we want to add /netlify"
			// also, in production do we leave it as dotcomstg or what bucket should it be changed to?
			await run(
				`${process.cwd()}/mut/mut-publish`,
				[
					"snooty/public",
					docsetEntry.bucket.dotcomstg,
					"--prefix=/netlify/docs-qa",
					"--deploy",
					`--deployed-url-prefix=${docsetEntry.url.dotcomstg}`,
					"--json",
					"--all-subdirectories",
				],
				{ input: "y" },
			);
		} catch (e) {
			console.log(`Error occurred while running mut-publish: ${e}`);
		}
	},
);

/**
 * Function to convert git modifed files to links of the staged files. Needs to be in markdown
 * so on the deploy summary the text appears as a link not just as text.
 *
 * @param modifiedFiles
 * @param netlifyURL
 * @returns string[]
 */
export function createMarkdown(
	modifiedFiles: readonly string[],
	netlifyURL: string,
): string[] {
	const IGNORED_DIRS = new Set(["includes", "images", "examples"]);

	const markdownList = [];
	for (const modifiedFile of modifiedFiles) {
		const modifiedFilePath = modifiedFile.split("/");

		// check if this is equal to 'source'
		const isSourceDir = modifiedFilePath[0] === "source";

		// check if this is equal to either images, includes, or examples
		const isNonIgnoredDir = !IGNORED_DIRS.has(modifiedFilePath[1]);

		if (isSourceDir && isNonIgnoredDir) {
			const shortform = modifiedFile.replace("source", "").replace(".txt", "");
			markdownList.push(`[${modifiedFile}](${netlifyURL + shortform})`);
		}
	}

	return markdownList;
}

export { integration };
