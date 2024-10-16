// Documentation: https://sdk.netlify.com
import { NetlifyExtension } from '@netlify/sdk';
import { getProperties } from './getProperties';

const extension = new NetlifyExtension();

extension.addBuildEventHandler(
  'onPreBuild',
  async ({ netlifyConfig }) => {
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

    const branchName =
      process.env.BRANCH_NAME ?? netlifyConfig.build?.environment.BRANCH;
    const repoName =
      process.env.REPO_NAME ?? netlifyConfig.build?.environment.SITE_NAME;

    //set environment to dotcomprd or prd if it is a writer build, only Mongodb-Snooty site name pre-configured
    process.env.ENV ??= isProdDeploy ? 'dotcomprd' : 'prd';

    const { repo, docsetEntry } = await getProperties({
      branchName: branchName,
      repoName: repoName,
    });
    const { branches: branch, ...repoEntry } = repo;
    netlifyConfig.build.environment.REPO = repoEntry;
    netlifyConfig.build.environment.DOCSET = docsetEntry;
    netlifyConfig.build.environment.BRANCH = branch;

    console.log(
      netlifyConfig.build.environment.PRODUCTION,
      netlifyConfig.build.environment.REPO,
      netlifyConfig.build.environment.DOCSET,
      netlifyConfig.build.environment.BRANCH,
    );
  },
  {
    if: (netlifyConfig) =>
      netlifyConfig.build?.environment?.POPULATE_METADATA_ENABLED,
  },
);

export { extension };
