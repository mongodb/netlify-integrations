import { ObjectId } from "mongodb";
import { insert } from "../db-operations";
import { Toc } from "../toc";

const COLLECTION_NAME = 'metadata';

export interface AssociatedProduct {
  name: string;
  versions?: string[];
}

export interface Metadata {
  project: string;
  branch: string;
  associated_products?: AssociatedProduct[];
  toctree: Toc;
  toctreeOrder: any[];
  github_username?: string;

}

export const insertMetadata = async (buildId: ObjectId, metadata: Metadata) => {
  try {
    return insert([metadata], COLLECTION_NAME, buildId, true);
  } catch (error) {
    console.error(`Error at insertion time for ${COLLECTION_NAME}: ${error}`);
    throw error;
  }
};
