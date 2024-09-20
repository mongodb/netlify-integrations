import { readdir, readFile, existsSync } from 'fs';
import { promisify } from 'util';
import { Page } from '../update-pages';
import { deserialize } from 'bson';

const readFileAsync = promisify(readFile);
const ZIP_PATH = `${process.cwd()}/bundle`;

function getBsonFileNames(
  zipContents: string[] | Buffer[]
): Array<string | Buffer> {
  return zipContents.filter((fileName) => {
    const splitFile = fileName.toString().split('.');

    return splitFile[splitFile.length - 1] === 'bson';
  });
}

async function getBsonFiles(
  bsonFileNames: Array<string | Buffer>,
  path: string,
) {
  return Promise.all(
    bsonFileNames
      .filter((bsonFileName) => bsonFileName.includes(path))
      .map(async (bsonFileName) => {
        const rawData = await readFileAsync(`${ZIP_PATH}/${bsonFileName}`);
        return deserialize(rawData) as Page;
      })
  );
}
export async function getDocumentPages(
  zipContents: string[] | Buffer[]
): Promise<Page[]> {
  const bsonFileNames = getBsonFileNames(zipContents);

  return getBsonFiles(bsonFileNames, 'documents/');
}

export async function getAssetPages(zipContents: string[] | Buffer[]) {

    const bsonFileNames = getBsonFileNames(zipContents);

  return getBsonFiles(bsonFileNames, 'assets/');
}
