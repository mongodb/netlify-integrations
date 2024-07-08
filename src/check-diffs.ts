import { FindCursor } from "mongodb";

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
}

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
 * Compares the ASTs of the current pages with the previous pages. New update
 * operations are added whenever a diff in the page ASTs is found. Page IDs are
 * removed from `prevPageIds` to signal that the previous page has been "seen"
 */
// export function checkForPageDiffs() {
//   currentPages.forEach((page) => {
//     // Filter out rst (non-page) files
//     if (!page.filename.endsWith(".txt")) {
//       return;
//     }

//     const currentPageId = page.page_id;
//     this.prevPageIds.delete(currentPageId);
//     const prevPageData = this.prevPageDocsMapping[currentPageId];

//     // Update the document if page's current AST is different from previous build's.
//     // New pages should always count as having a "different" AST
//     if (!isEqual(page.ast, prevPageData?.ast)) {
//       const operation = {
//         updateOne: {
//           filter: {
//             page_id: currentPageId,
//             github_username: page.github_username,
//           },
//           update: {
//             $set: {
//               page_id: currentPageId,
//               filename: page.filename,
//               ast: page.ast,
//               static_assets: this.findUpdatedAssets(
//                 page.static_assets,
//                 prevPageData?.static_assets
//               ),
//               updated_at: this.updateTime,
//               deleted: false,
//               // Track the last build ID to update the content
//               build_id: this.buildId,
//             },
//             $setOnInsert: {
//               created_at: this.updateTime,
//             },
//           },
//           upsert: true,
//         },
//       };
//       this.operations.push(operation);
//     }
//   });
// }
