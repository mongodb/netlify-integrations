// Documentation: https://sdk.netlify.com
import { NetlifyExtension } from '@netlify/sdk';
import { getBranch } from './getProperties';

const extension = new NetlifyExtension();

extension.addBuildEventHandler(
  'onPreBuild',
  async ({ netlifyConfig, buildContext }) => {
    // If the build event handler is not enabled, return early

    if (!process.env.POPULATE_METADATA_ENABLED) {
      return;
    }
    console.log('Hello there.');

    if (
      netlifyConfig.build.environments.INCOMING_HOOK_UR &&
      netlifyConfig.build.environments.INCOMING_HOOK_TITLE
    ) {
      const branchName = netlifyConfig.build?.environment.BRANCH;
      const repoName =
        process.env.REPO_NAME ?? netlifyConfig.build?.environment.SITE_NAME;
      console.log(getBranch(branchName, repoName));
      // console.log('INITIAL TEST VAR:', netlifyConfig.build.testVar);
      // netlifyConfig.build.testVar = 'TESTING';
      // console.log('SUBSEQUENT TEST VAR:', netlifyConfig.build.testVar);
    }
  },
);

export { extension };
