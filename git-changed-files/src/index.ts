import { NetlifyIntegration } from '@netlify/sdk';

// import type { Db } from 'mongodb';
// import * as mongodb from 'mongodb';

const integration = new NetlifyIntegration();
// let dbInstance: Db;
// let client: mongodb.MongoClient;

// export interface BranchEntry {
// 	name?: string;
// 	gitBranchName: string;
// 	urlSlug: string;
// 	isStableBranch: boolean;
// 	active: boolean;
//   }

// export const db = async ({ uri, dbName }: { uri: string; dbName: string }) => {
// 	client = new mongodb.MongoClient(uri);
// 	try {
// 	  await client.connect();
// 	  dbInstance = client.db(dbName);
// 	} catch (error) {
// 	  const err = `Error at db client connection: ${error} for uri ${uri} and db name ${dbName}`;
// 	  console.error(err);
// 	  throw err;
// 	}
// 	return dbInstance;
//   };

// helper function to find the associated branch
// export const getBranch = (branches: Array<BranchEntry>, branchName: string) => {
// 	for (const branchObj of branches) {
// 	  if (branchObj.gitBranchName.toLowerCase() == branchName.toLowerCase()) {
// 		return { ...branchObj };
// 	  }
// 	}
// 	throw new Error(`Branch ${branchName} not found in branches object`);
// };

  // some code from DOP-5023
integration.addBuildEventHandler("onSuccess", async ({ utils: { run } }) => {
	// console.log(`current dir ${process.cwd()}`);
	// // download the mut repo 
	// await run.command(
	//   "curl -L -o mut.zip https://github.com/mongodb/mut/releases/download/v0.11.4/mut-v0.11.4-linux_x86_64.zip"
	// );
	// await run.command("unzip -d . mut.zip");
  
	// await run.command("cd snooty/config");
	// run.command("ls -a");
	// await run.command("mut-redirects snooty/config/redirects");
	// // run.command("ls -a");

	console.log("trying to get reponame");
	const REPO_NAME = process.env.REPO_NAME;
	//check that an environment variable for repo name was set
	if (!REPO_NAME) {
		throw new Error(
			'No repo name supplied as environment variable, manifest cannot be uploaded to Atlas Search.Documents collection ',
		);
	} else {
		console.log("the repo name is: ", REPO_NAME);
	}

  });

integration.addBuildEventHandler('onSuccess', ({ utils: { status, git } }) => {
	console.log('Checking if any files changed on git -----');
	console.log('Modified files TEST:', git.modifiedFiles);

	if (!process.env.DEPLOY_PRIME_URL) {
		console.error('ERROR! process.env.DEPLOY_PRIME_URL is not defined.');
		return;
	}

	const markdownList = createMarkdown(
		git.modifiedFiles,
		process.env.DEPLOY_PRIME_URL,
	);

	if (markdownList.length !== 0) {
		status.show({
			title: `URLs to Changed Files`,
			summary: markdownList.join('\n'),
		});
	}

  console.log("trying to get reponame");
	const REPO_NAME = process.env.REPO_NAME;
	//check that an environment variable for repo name was set
	if (!REPO_NAME) {
		throw new Error(
			'No repo name supplied as environment variable, manifest cannot be uploaded to Atlas Search.Documents collection ',
		);
	} else {
		console.log("the repo name is: ", REPO_NAME);
	}
});



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
	const IGNORED_DIRS = new Set(['includes', 'images', 'examples']);

	const markdownList = [];
	for (const modifiedFile of modifiedFiles) {
		const modifiedFilePath = modifiedFile.split('/');

		// check if this is equal to 'source'
		const isSourceDir = modifiedFilePath[0] === 'source';

		// check if this is equal to either images, includes, or examples
		const isNonIgnoredDir = !IGNORED_DIRS.has(modifiedFilePath[1]);

		if (isSourceDir && isNonIgnoredDir) {
			const shortform = modifiedFile.replace('source', '').replace('.txt', '');
			markdownList.push(`[${modifiedFile}](${netlifyURL + shortform})`);
		}
	}

	return markdownList;
}

export { integration };
