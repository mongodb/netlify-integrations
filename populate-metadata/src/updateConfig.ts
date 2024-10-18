import { NetlifyExtension } from '@netlify/sdk';
import { getProperties } from './getProperties';

export const updateConfig = async (netlifyConfig: any) => {
  {
    if (!process.env.POPULATE_METADATA_ENABLED) return;
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

    console.log(branchName);

    //set environment to dotcomprd or prd if it is a writer build, only Mongodb-Snooty site name pre-configured
    process.env.ENV ??= isProdDeploy ? 'dotcomprd' : 'prd';

    const { repo, docsetEntry } = await getProperties({
      branchName: branchName,
      repoName: repoName,
    });
    console.log(repo, docsetEntry);
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
  }
};
