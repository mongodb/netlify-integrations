// Documentation: https://sdk.netlify.com
import { NetlifyExtension } from '@netlify/sdk';
import { getProperties } from './getProperties';

const extension = new NetlifyExtension();

extension.addBuildEventHandler(
  'onPreBuild',
  async ({ netlifyConfig, buildContext }) => {
    // If the build event handler is not enabled on given site, return early
    if (!process.env.POPULATE_METADATA_ENABLED) {
      return;
    }
    //check if build was triggered by a webhook (If so, it was a prod deploy);
    const isProdDeploy = !!(
      netlifyConfig.build.environment?.INCOMING_HOOK_URL &&
      netlifyConfig.build.environment?.INCOMING_HOOK_TITLE &&
      netlifyConfig.build.environment?.INCOMING_HOOK_BODY
    );
    netlifyConfig.build.environment.PRODUCTION = isProdDeploy;

    //get branch name, repo name from the config
    const branchName = netlifyConfig.build?.environment.BRANCH;
    const repoName =
      process.env.REPO_NAME ?? netlifyConfig.build?.environment.SITE_NAME;

    //set environment to dotcomprd or prd if it is a writer build
    process.env.ENV =
      (repoName !== 'mongodb-snooty' ?? isProdDeploy) ? 'dotcomprd' : 'prd';
    console.log();

    const { repo, docsetEntry, branch } = await getProperties({
      branchName: branchName,
      repoName: repoName,
    });

    netlifyConfig.build.environment.REPO = repo;
    netlifyConfig.build.environment.DOCSET = docsetEntry;
    netlifyConfig.build.environment.BRANCH = branch;

    console.log(
      netlifyConfig.build.environment.PRODUCTION,
      netlifyConfig.build.environment.REPO,
      netlifyConfig.build.environment.DOCSET,
      netlifyConfig.build.environment.BRANCH,
    );
  },
);

export { extension };
