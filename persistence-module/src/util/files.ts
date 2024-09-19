import { readdir, readFile, existsSync } from 'fs';
import { promisify } from 'util';
import { Page } from '../update-pages';
import { deserialize } from 'bson';

const readFileAsync = promisify(readFile);
const ZIP_PATH = `${process.cwd()}/bundle`;

export async function getPageDocuments(zipContents: string[] | Buffer[]): Promise<Page[]> {
  const bsonPages = zipContents.filter((fileName) => {
    const splitFile = fileName.toString().split('.');

    return splitFile[splitFile.length - 1] === 'bson';
  });

  return Promise.all(
    bsonPages
      .filter((bsonFile) => bsonFile.includes('documents/'))
      .map(async (bsonFileName) => {
        const rawData = await readFileAsync(`${ZIP_PATH}/${bsonFileName}`);

        return deserialize(rawData) as Page;
      })
  );
}

