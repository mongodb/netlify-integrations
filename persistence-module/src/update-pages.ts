import type { AnyBulkWriteOperation, FindCursor } from "mongodb";
import isEqual from "fast-deep-equal";
import { db } from "./connector";
import { bulkWrite } from "./db-operations";

interface PreviousPageMapping {
  [key: string]: {
    ast: PageAst;
    static_assets: StaticAsset[];
  };
}

export interface StaticAsset {
  checksum: string;
  key: string;
  updated_at?: Date;
}
export interface PageAst {
  [key: string]: unknown;
  type: string;
  position: Record<string, unknown>;
  children: PageAst[];
  fileid: string;
  options: Record<string, unknown>;
}
export interface Page {
  page_id: string;
  filename: string;
  ast: PageAst;
  source: string;
  static_assets: StaticAsset[];
  github_username: string;
}
export interface UpdatedPage extends Page {
  created_at: Date;
  updated_at: Date;
  deleted: boolean;
}
export const GITHUB_USER = "docs-builder-bot";

export const createPageAstMapping = async (docsCursor: FindCursor) => {
  // Create mapping for page id and its AST
  const mapping: PreviousPageMapping = {};
  // Create set of all page ids. To be used for tracking unseen pages in the current build
  const pageIds = new Set<string>();
  for await (const doc of docsCursor) {
    mapping[doc.page_id] = {
      ast: doc.ast,
      static_assets: doc.static_assets,
    };
    pageIds.add(doc.page_id);
  }
  return { mapping, pageIds };
};

/**
 * Finds the page documents for a given Snooty project + branch + user combination.
 * If this is the first build for the Snooty project + branch + user, no documents
 * will be found.
 *
 * @param pageIdPrefix - Includes the Snooty project name, user (docsworker-xlarge), and branch
 * @param collection - The collection to perform the find query on
 */
const findPrevPageDocs = async (
  pageIdPrefix: string,
  collection: string,
  githubUser: string
) => {
  const dbSession = await db();
  const findQuery = {
    page_id: { $regex: new RegExp(`^${pageIdPrefix}/`) },
    github_username: githubUser,
    deleted: false,
  };
  const projection = {
    _id: 0,
    page_id: 1,
    ast: 1,
    static_assets: 1,
  };

  try {
    return dbSession
      .collection<UpdatedPage>(collection)
      .find(findQuery)
      .project(projection);
  } catch (error) {
    console.error(
      `Error trying to find previous page documents using prefix ${pageIdPrefix} in ${collection}}: ${error}`
    );
    throw error;
  }
};

/**
 * Upserts pages in separate collection. Copies of a page are created by page_id.
 * Updated pages within the same Snooty project name + branch should only update
 * related page documents.
 *
 * @param pages
 * @param collection
 */
export const updatePages = async (pages: Page[], collection: string) => {
  if (pages.length === 0) {
    return;
  }

  try {
    const updateTime = new Date();
    // Find all pages that share the same project name + branch. Expects page IDs
    // to include these two properties after parse
    const pageIdPrefix = pages[0].page_id.split("/").slice(0, 3).join("/");
    const previousPagesCursor = await findPrevPageDocs(
      pageIdPrefix,
      collection,
      GITHUB_USER
    );
    const { mapping: prevPageDocsMapping, pageIds: prevPageIds } =
      await createPageAstMapping(previousPagesCursor);

    const operations = [
      ...checkForPageDiffs({
        prevPageDocsMapping,
        prevPageIds,
        currentPages: pages,
        updateTime,
      }),
      ...markUnseenPagesAsDeleted({ prevPageIds, updateTime }),
    ];

    if (operations.length > 0) {
      await bulkWrite(operations, collection);
    }
  } catch (error) {
    console.error(`Error when trying to update pages: ${error}`);
    throw error;
  }
};

interface MarkUnseenPagesAsDeletedParams {
  updateTime: Date;
  prevPageIds: Set<string>;
}
function markUnseenPagesAsDeleted({
  prevPageIds,
  updateTime,
}: MarkUnseenPagesAsDeletedParams) {
  const operations: AnyBulkWriteOperation[] = [];
  prevPageIds.forEach((unseenPageId) => {
    const operation = {
      updateOne: {
        filter: { page_id: unseenPageId, github_username: GITHUB_USER },
        update: {
          $set: {
            deleted: true,
            updated_at: updateTime,
          },
        },
      },
    };
    operations.push(operation);
  });
  return operations;
}

interface CheckForPageDiffsParams {
  currentPages: Page[];
  updateTime: Date;
  prevPageDocsMapping: PreviousPageMapping;
  prevPageIds: Set<string>;
}
/**
 * Compares the ASTs of the current pages with the previous pages. New update
 * operations are added whenever a diff in the page ASTs is found. Page IDs are
 * removed from `prevPageIds` to signal that the previous page has been "seen"
 */
export function checkForPageDiffs({
  currentPages,
  updateTime,
  prevPageDocsMapping,
  prevPageIds,
}: CheckForPageDiffsParams) {
  const operations: AnyBulkWriteOperation[] = [];
  currentPages.forEach((page) => {
    // Filter out rst (non-page) files
    if (!page.filename.endsWith(".txt")) {
      return;
    }

    const currentPageId = page.page_id;
    prevPageIds.delete(currentPageId);
    const prevPageData = prevPageDocsMapping[currentPageId];

    // Update the document if page's current AST is different from previous build's.
    // New pages should always count as having a "different" AST
    if (isEqual(page.ast, prevPageData?.ast)) return;
    const operation = {
      updateOne: {
        filter: {
          page_id: currentPageId,
          github_username: page.github_username,
        },
        update: {
          $set: {
            page_id: currentPageId,
            filename: page.filename,
            ast: page.ast,
            static_assets: findUpdatedAssets(
              page.static_assets,
              updateTime,
              prevPageData?.static_assets
            ),
            updated_at: updateTime,
            deleted: false,
            // Track the last build ID to update the content
          },
          $setOnInsert: {
            created_at: updateTime,
          },
        },
        upsert: true,
      },
    };
    operations.push(operation);
  });
  return operations;
}

/**
 * Identifies any changes in assets between the current page and its previous page.
 * A new array of static assets with their last update time is returned.
 *
 * The Snooty Data API will take into account an asset's `updated_at` field to
 * compare with timestamps that it receives on requests for updated pages. When
 * the API sends an updated page, an updated page's asset will only be sent if that asset's
 * timestamp is greater than the timestamp sent in the request (denoting a change).
 * Unchanged assets with older timestamps will not be sent.
 *
 * Assets that are deleted between builds are not included since the Snooty Data API
 * will not need to return it for now.
 *
 * @param currentPageAssets
 * @param prevPageAssets
 */
function findUpdatedAssets(
  currentPageAssets: StaticAsset[],
  updateTime: Date,
  prevPageAssets?: StaticAsset[]
) {
  const updatedAssets: StaticAsset[] = [];
  if (
    currentPageAssets &&
    currentPageAssets.length === 0 &&
    prevPageAssets &&
    prevPageAssets.length === 0
  ) {
    return updatedAssets;
  }

  const prevAssetMapping: Record<string, { key: string; updated_at: Date }> =
    {};
  if (prevPageAssets) {
    prevPageAssets.forEach((asset) => {
      prevAssetMapping[asset.checksum] = {
        key: asset.key,
        updated_at: asset.updated_at ?? updateTime,
      };
    });
  }

  currentPageAssets.forEach(({ checksum, key }) => {
    const prevAsset = prevAssetMapping[checksum];
    // Edge case: check to ensure previous asset exists with the same checksum,
    // but different key/filename. This can happen if an image is renamed
    const isSame = prevAsset && prevAsset.key === key;
    // Most common case: no change in asset; we keep the updated time the same
    const timeOfUpdate = isSame ? prevAsset.updated_at : updateTime;
    updatedAssets.push({
      checksum,
      key,
      updated_at: timeOfUpdate,
    });
  });

  return updatedAssets;
}
