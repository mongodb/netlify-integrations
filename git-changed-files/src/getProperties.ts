import type {
    DatabaseDocument,
    DocsetsDocument,
    ReposBranchesDocument,
} from "./types";
import {
    getCollection,
    getSnootyDb,
} from "./searchConnector";
import type { Collection } from 'mongodb';

export const getProperties = async (repo_name: string) => {
    //TODO: change these teamwide env vars in Netlify UI when ready to move to prod
    const SNOOTY_DB_NAME = `${process.env.MONGO_ATLAS_POOL_DB_NAME}`; 
    const second_repo_name = process.env.REPO_NAME;

    console.log("im in getpropeties");
    console.log(SNOOTY_DB_NAME, second_repo_name, repo_name);

    //connect to database and get repos_branches, docsets collections
    const dbSession = await getSnootyDb();
    const repos_branches = getCollection(dbSession, "repos_branches");
    const docsets = getCollection(dbSession, "docsets");

    console.log("connected to databases");
    const repo: ReposBranchesDocument = await getRepoEntry({
        repoName: repo_name,
        repos_branches,
    });

    console.log("got repo");
    const { project } = repo;
    const docsetEntry: DocsetsDocument = await getDocsetEntry(docsets, project);
    console.log("printing the entries I queried --------------------");
    console.log(repo);
    console.log(docsetEntry);

    return docsetEntry;
};

export const getDocsetEntry = async (
    docsets: Collection<DatabaseDocument>,
    project: string
    ) => {
    const docsetsQuery = { project: { $eq: project } };
    const docset = await docsets.findOne<DocsetsDocument>(docsetsQuery);
    if (!docset) {
        throw new Error("Error while getting docsets entry in Atlas");
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
  
    return repo;
};