import { NetlifyIntegration } from '@netlify/sdk';
import { ManifestEntry } from './manifestEntry';

import type { Db } from 'mongodb';
import { db } from "./searchConnector";
import * as mongodb from 'mongodb';

const integration = new NetlifyIntegration();


export interface DatabaseDocument extends ManifestEntry {
  url: string;
  lastModified: Date;
  manifestRevisionId: string;
  searchProperty: string[];
  includeInGlobalSearch: boolean;
}

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
// integration.addBuildEventHandler("onSuccess", async ({ utils: { run }, netlifyConfig }) => {
// 	// console.log(`current dir ${process.cwd()}`);
// 	// // download the mut repo 
// 	// await run.command(
// 	//   "curl -L -o mut.zip https://github.com/mongodb/mut/releases/download/v0.11.4/mut-v0.11.4-linux_x86_64.zip"
// 	// );
// 	// await run.command("unzip -d . mut.zip");
  
// 	// await run.command("cd snooty/config");
// 	// run.command("ls -a");
// 	// await run.command("mut-redirects snooty/config/redirects");
// 	// // run.command("ls -a");

// 	console.log("HELLO THIS IS MY TEST");
// 	const repoName = process.env.REPO_NAME ?? netlifyConfig.build.environment["SITE_NAME"];
//   console.log("NAMES are:",process.env.REPO_NAME,  netlifyConfig.build.environment["SITE_NAME"], repoName);
// 	//check that an environment variable for repo name was set
// 	if (!repoName) {
// 		throw new Error(
// 			'No repo name supplied as environment variable, manifest cannot be uploaded to Atlas Search.Documents collection ',
// 		);
// 	} else {
// 		console.log("the repo name is: ", repoName);
// 	}

//   });

integration.addBuildEventHandler('onSuccess', ({ utils: { status, git } , netlifyConfig}) => {
	console.log('Checking if any files changed on git -----');
	console.log('Modified files:', git.modifiedFiles);

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

  // new functionalilty that should be moved ------------------------------------------------------------------
  console.log("trying to get REPO NAME ------------------------------------");
  const repoName = process.env.REPO_NAME ?? netlifyConfig.build.environment["SITE_NAME"];
  console.log("NAMES are:",process.env.REPO_NAME,  netlifyConfig.build.environment["SITE_NAME"], repoName);

	//check that an environment variable for repo name was set ----------
	if (!repoName) {
		throw new Error(
			'No repo name supplied as environment variable, manifest cannot be uploaded to Atlas Search.Documents collection ',
		);
	} else {
		console.log("the repo name is: ", repoName);
	}

  // do i need to get the branch as well ? 

  // connect to mongodb and pool.docsets to get buck---------
  getProperties(repoName);
  // download mut and run mut publish----------
});

const getProperties = async (repo_name: string) => {
  const ATLAS_CLUSTER0_URI = `mongodb+srv://${process.env.MONGO_ATLAS_USERNAME}:${process.env.MONGO_ATLAS_PASSWORD}@${process.env.MONGO_ATLAS_CLUSTER0_HOST}/?retryWrites=true&w=majority`;
  //TODO: change these teamwide env vars in Netlify UI when ready to move to prod
  const SNOOTY_DB_NAME = `${process.env.MONGO_ATLAS_POOL_DB_NAME}`; 
  const second_repo_name = process.env.REPO_NAME;

  console.log(SNOOTY_DB_NAME, second_repo_name, repo_name);
  
  let dbSession: Db;
  let docsets;
  let url: string = "";
  let searchProperty: string = "";
  let repo: any;
  let docsetRepo: any;

  try {
    dbSession = await db(ATLAS_CLUSTER0_URI, SNOOTY_DB_NAME);
    docsets = dbSession.collection<DatabaseDocument>("docsets");
  } catch (e) {
    console.log("issue starting session for Snooty Pool Database", e);
  }

  const query = {
    project: repo_name,
  };

  try {
    docsetRepo = await docsets?.find(query).toArray();
    // if (docsetRepo.length) {
    //   url = docsetRepo[0].url.dotcomprd + docsetRepo[0].prefix.dotcomprd;
    // }
    console.log("succes on getting docset data: ", docsetRepo);
  } catch (e) {
    console.error(`Error while getting docsets entry in Atlas ${e}`);
    throw e;
  }

}



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
