import { NetlifyExtension } from '@netlify/sdk';
import type { NetlifyConfig } from '@netlify/build';

import { getProperties } from './getProperties';
import type { DocsetsDocument } from './types';

export interface Build {
  command?: string;
  publish: string;
  base: string;
  services: Record<string, unknown>;
  ignore?: string;
  edge_handlers?: string;
  edge_functions?: string;
  environment: Partial<
    Record<string, string | boolean | DocsetsDocument | any>
  >;
  processing: {
    skip_processing?: boolean;
    css: {
      bundle?: boolean;
      minify?: boolean;
    };
    js: {
      bundle?: boolean;
      minify?: boolean;
    };
    html: {
      pretty_url?: boolean;
    };
    images: {
      compress?: boolean;
    };
  };
}
interface DocsConfig extends Omit<NetlifyConfig, 'build'> {
  build: Build;
}

export const updateConfig = async (config: DocsConfig) => {
  const branchName =
    process.env.BRANCH_NAME ?? config.build?.environment.BRANCH;
  const repoName = process.env.REPO_NAME ?? config.build?.environment.SITE_NAME;
  if (!branchName || !repoName) {
    throw new Error('RepoName or branch name missing from deploy');
  }
  console.log(branchName, repoName);
  //check if build was triggered by a webhook (If so, it was a prod deploy);
  const isProdDeploy = !!(
    config.build.environment?.INCOMING_HOOK_URL &&
    config.build.environment?.INCOMING_HOOK_TITLE &&
    config.build.environment?.INCOMING_HOOK_BODY
  );
  config.build.environment.PRODUCTION = isProdDeploy.toString();
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
};
