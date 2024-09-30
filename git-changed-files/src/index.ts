import { NetlifyIntegration } from '@netlify/sdk';
import {
  BranchEntry,
  DatabaseDocument,
  DocsetsDocument,
  ReposBranchesDocument,
} from "./types";
import {
  closeSnootyDb,
  db,
  getCollection,
  getSnootyDb,
  teardown,
} from "./searchConnector";

import type { Collection, Db } from 'mongodb';
import * as mongodb from 'mongodb';

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
  
  //connect to database and get repos_branches, docsets collections
  const dbSession = await getSnootyDb();
  const repos_branches = getCollection(dbSession, "repos_branches");
  const docsets = getCollection(dbSession, "docsets");

  const repo: ReposBranchesDocument = await getRepoEntry({
    repoName: repo_name,
    repos_branches,
  });

  const { project } = repo;
  const docsetEntry = await getDocsetEntry(docsets, project);
  console.log("printing the entries I queried --------------------");
  console.log(repo);
  console.log(docsetEntry);

}

export const getDocsetEntry = async (
  docsets: Collection<DatabaseDocument>,
  project: string
) => {
  const docsetsQuery = { project: { $eq: project } };
  const docset = await docsets.findOne<DocsetsDocument>(docsetsQuery);
  if (!docset) {
    throw new Error(`Error while getting docsets entry in Atlas`);
  }
  return docset;
};

export const getRepoEntry = async ({
  repoName,
  repos_branches,
}: {
  repoName: string;
  repos_branches: Collection<DatabaseDocument>;
}) => {
  const query = {
    repoName: repoName,
  };

  const repo = await repos_branches.findOne<ReposBranchesDocument>(query, {
    projection: {
      _id: 0,
      project: 1,
      search: 1,
      branches: 1,
      prodDeployable: 1,
      internalOnly: 1,
    },
  });
  if (!repo) {
    throw new Error(
      `Could not get repos_branches entry for repo ${repoName}, ${repo}, ${JSON.stringify(
        query
      )}`
    );
  }
  // don't think i need this code for the mut plugin , this is a manifest thing ---------------------------
  // if (
  //   repo.internalOnly ||
  //   !repo.prodDeployable ||
  //   !repo.search?.categoryTitle
  // ) {
  //   // deletestaleproperties here for ALL manifests beginning with this repo? or just for this project-version searchproperty
  //   await deleteStaleProperties(repo.project);
  //   throw new Error(
  //     `Search manifest should not be generated for repo ${repoName}. Removing all associated manifests`
  //   );
  // }

  return repo;
};



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
