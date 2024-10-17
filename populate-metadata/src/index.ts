// Documentation: https://sdk.netlify.com
import { NetlifyExtension } from '@netlify/sdk';
import { getProperties } from './getProperties';
import { Extension } from './initialization';
import { updateConfig } from './updateConfig';

const extension = new Extension();
const otherExtension = new Extension();
otherExtension.addBuildEventHandler('onPreBuild', async ({ netlifyConfig }) =>
  updateConfig(),
);

extension.addBuildEventHandler('onPreBuild', async ({ netlifyConfig }) => {
  // If the build event handler is not enabled on given site, return early
  const environmentConfig = netlifyConfig.build.environment;

  if (process.env.POPULATE_METADATA_ENABLED !== 'true') {
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
});

export { extension, otherExtension };
