// Documentation: https://sdk.netlify.com
import { NetlifyExtension } from '@netlify/sdk';
import { getBranch, getProperties } from './getProperties';
import type {
  BranchEntry,
  DocsetsDocument,
  ReposBranchesDocument,
} from './types';

const extension = new NetlifyExtension();

extension.addBuildEventHandler(
  'onPreBuild',
  async ({ netlifyConfig, buildContext }) => {
    // If the build event handler is not enabled on given site, return early
    if (!process.env.POPULATE_METADATA_ENABLED) {
      return;
    }

    //get bracnh name, repo name from the config
    const branchName = netlifyConfig.build?.environment.BRANCH;
    const repoName =
      process.env.REPO_NAME ?? netlifyConfig.build?.environment.SITE_NAME;
    const { repo, docsetEntry, branch } = await getProperties({
      branchName: branchName,
      repoName: repoName,
    });

    //check if build was triggered by a webhook (If so, it was a prod deploy);
    const isProdDeploy = !!(
      netlifyConfig.build.environment?.INCOMING_HOOK_URL &&
      netlifyConfig.build.environment?.INCOMING_HOOK_TITLE &&
      netlifyConfig.build.environment?.INCOMING_HOOK_BODY
    );
    netlifyConfig.build.environment.PRODUCTION = isProdDeploy;
    netlifyConfig.build.environment.REPO = repo;
    netlifyConfig.build.REPO_NAME = 'gibberish';
    console.log(
      netlifyConfig.build.environment.PRODUCTION,
      netlifyConfig.build.environment.REPO,
    );

    // const updatedDocsetEntry = getEnvDependentProperties(
    //   docsetEntry,
    //   isProdDeploy,
    // );
    // storeMetadata(
    //   updatedDocsetEntry,
    //   repo,
    //   branch,
    //   netlifyConfig.build.environment,
    // );
  },
);

export { extension };

//TODO: only persist environmentally accurate fields
const getEnvDependentProperties = (
  docsetEntry: DocsetsDocument,
  isProdDeploy: boolean,
): DocsetsDocument => {
  return docsetEntry;
};

//TODO: check deep equality, maybe return netlify config here
const storeMetadata = (
  docset: DocsetsDocument,
  repo: ReposBranchesDocument,
  branch: BranchEntry,
  envConfig: netlifyConfig.build.environment,
) => {
  envConfig.docset = docset;
  envConfig.repo = repo;
  envConfig.branch = branch;
};
