import type { Collection, Db, WithId } from 'mongodb';
import type {
  BranchEntry,
  DocsetsDocument,
  ReposBranchesDocument,
} from './types';
import {
  closeSnootyDb,
  getDocsetsCollection,
  getReposBranchesCollection,
} from './atlasConnector';

export const getDocsetEntry = async ({
  docsets,
  project,
}: {
  docsets: Collection<DocsetsDocument>;
  project: string;
}): Promise<WithId<DocsetsDocument>> => {
  //TODO: make this env dependent IF the name is snooty
  const envProjection = { dotcomstg: 1 };
  const docsetsQuery = { project: { $eq: project } };
  const projection = {
    projection: {
      project: 1,
      _id: 0,
      bucket: envProjection,
      prefix: envProjection,
      url: envProjection,
    },
  };
  const docset = await docsets.findOne<DocsetsDocument>(
    docsetsQuery,
    projection,
  );
  if (!docset) {
    throw new Error('Error while getting docsets entry in Atlas');
  }
  return docset;
};

export const getRepoEntry = async ({
  repoName,
  branchName,
  repos_branches,
}: {
  repoName: string;
  branchName: string;
  repos_branches: Collection<ReposBranchesDocument>;
}) => {
  const query = {
    repoName: repoName,
  };
  const projection = {
    projection: {
      _id: 0,
      branches: { $elemMatch: { gitBranchName: branchName.toLowerCase() } },
      project: 1,
      search: 1,
      internalOnly: 1,
      prodDeployable: 1,
    },
  };
  const repo = await repos_branches.findOne<ReposBranchesDocument>(
    query,
    projection,
  );
  if (!repo) {
    throw new Error(
      `Could not get repos_branches entry for repo ${repoName}, ${repo}, ${JSON.stringify(
        query,
      )}`,
    );
  }
  return repo;
};

// helper function to find the associated branch
export const getBranch = (branches: Array<BranchEntry>, branchName: string) => {
  const branchObj = branches.find(
    (branch) => branch.gitBranchName.toLowerCase() === branchName.toLowerCase(),
  );
  if (!branchObj)
    throw new Error(`Branch ${branchName} not found in branches object`);
  return branchObj;
};

export const getProperties = async ({
  branchName,
  repoName,
}: {
  branchName: string;
  repoName: string;
}) => {
  //connect to database and get repos_branches, docsets collections
  const repos_branches = await getReposBranchesCollection();
  const docsets = await getDocsetsCollection();

  const repo = await getRepoEntry({
    repoName,
    branchName,
    repos_branches,
  });

  const docsetEntry = await getDocsetEntry({ docsets, project: repo.project });

  await closeSnootyDb();

  const branch = getBranch(repo.branches, branchName);

  //TODO: remove branches field from repos_branches

  return { repo, docsetEntry, branch };
};
