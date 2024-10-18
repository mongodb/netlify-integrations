import { NetlifyExtension } from '@netlify/sdk';
import { getProperties } from './getProperties';

export const updateConfig = async (config: any) => {
  {
    //check if build was triggered by a webhook (If so, it was a prod deploy);
    const isProdDeploy = !!(
      config.build.environment?.INCOMING_HOOK_URL &&
      config.build.environment?.INCOMING_HOOK_TITLE &&
      config.build.environment?.INCOMING_HOOK_BODY
    );
    config.build.environment.PRODUCTION = isProdDeploy;

    const branchName =
      process.env.BRANCH_NAME ?? config.build?.environment.BRANCH;
    const repoName =
      process.env.REPO_NAME ?? config.build?.environment.SITE_NAME;

    console.log(branchName);

    //set environment to dotcomprd or prd if it is a writer build, only Mongodb-Snooty site name pre-configured
    process.env.ENV ??= isProdDeploy ? 'dotcomprd' : 'prd';

    const { repo, docsetEntry } = await getProperties({
      branchName: branchName,
      repoName: repoName,
    });
    console.log(repo, docsetEntry);
    const { branches: branch, ...repoEntry } = repo;
    config.build.environment.REPO = repoEntry;
    config.build.environment.DOCSET = docsetEntry;
    config.build.environment.BRANCH = branch;

    console.log(
      config.build.environment.PRODUCTION,
      config.build.environment.REPO,
      config.build.environment.DOCSET,
      config.build.environment.BRANCH,
    );
  }
};
