// Documentation: https://sdk.netlify.com
import { NetlifyIntegration } from '@netlify/sdk';
import { readdir, existsSync } from 'fs';
import { promisify } from 'util';
import {  updatePages } from './update-pages';
import { getAssetPages, getDocumentPages,  } from './util/files';
import { upsertAssets } from './assets';

const readdirAsync = promisify(readdir);

const integration = new NetlifyIntegration();
const ZIP_PATH = `${process.cwd()}/bundle`;

integration.addBuildEventHandler(
  'onSuccess',
  async ({ utils: { run } }) => {

    console.log('=========== Persistence Module Integration ================');

    const bundleDirExists = existsSync(`${process.cwd()}/bundle`);

    if (!bundleDirExists) await run.command('unzip -o bundle.zip -d bundle');

    const zipContents = await readdirAsync(ZIP_PATH, {
      recursive: true,
    });

    const sourcePages = await getDocumentPages(zipContents)
    const assetPages = await getAssetPages(zipContents)
    

    await Promise.all([updatePages(sourcePages, 'updated_documents'), upsertAssets(assetPages)])

    console.log('=========== Persistence Module Integration ================');
  }
);

export { integration };
