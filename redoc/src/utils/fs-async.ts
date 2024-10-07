import { writeFile, readFile } from 'node:fs';
import { promisify } from 'node:util';

export const readFileAsync = promisify(readFile);
export const writeFileAsync = promisify(writeFile);
