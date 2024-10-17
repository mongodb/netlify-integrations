import { NetlifyExtension } from '@netlify/sdk';
import { deserialize } from 'bson';
import { buildOpenAPIPages } from './build-pages';
import { readFileAsync } from './utils/fs-async';

const extension = new NetlifyExtension();
const BUNDLE_PATH = `${process.cwd()}/bundle`;
const REDOC_CLI_VERSION = '1.2.3';

export interface OASPageMetadata {
  source_type: string;
  source: string;
  api_version?: string;
  resource_versions?: string[];
}

export type OASPagesMetadata = Record<string, OASPageMetadata>;

// handle installing redoc cli if it's not already installed
extension.addBuildEventHandler(
	'onPreBuild',
	async ({ utils: { run, cache } }) => {
		if (!process.env.REDOC_ENABLED) return;
		
		console.log('Running redoc prebuild');
		const hasRedoc = await cache.has('redoc');

    if (hasRedoc) {
      console.log('Restoring redoc from cache');
      cache.restore('redoc');
      return;
    }

    await run.command(
      `git clone -b @dop/redoc-cli@${REDOC_CLI_VERSION} --depth 1 https://github.com/mongodb-forks/redoc.git redoc`,
    );

    await run.command('npm ci --prefix cli/ --omit=dev', {
      cwd: `${process.cwd()}/redoc`,
    });

    await cache.save('redoc');
  },
);

// handle building the redoc pages
extension.addBuildEventHandler('onPostBuild', async ({ utils: { run } }) => {
	if (!process.env.REDOC_ENABLED) return;
	console.log('=========== Redoc Extension Begin ================');
	await run.command('unzip -o bundle.zip -d bundle');

  const siteBson = await readFileAsync(`${BUNDLE_PATH}/site.bson`);

  const buildMetadata = deserialize(siteBson);
  const siteTitle: string = buildMetadata.title;
  const openapiPages: OASPagesMetadata | undefined =
    buildMetadata.openapi_pages;

  if (!openapiPages) {
    console.log('No OpenAPI pages found');
    return;
  }

  const openapiPagesEntries = Object.entries(openapiPages);
  const siteUrl = process.env.DEPLOY_PRIME_URL || '';

  await buildOpenAPIPages(openapiPagesEntries, { siteTitle, siteUrl }, run);

  console.log('=========== Redoc Integration End ================');
});

// cache redoc
extension.addBuildEventHandler('onSuccess', async ({ utils: { cache } }) => {
	if (!process.env.REDOC_ENABLED) return;
	const hasRedoc = await cache.has('redoc');
	if (!hasRedoc) {
		console.log('saving redoc to cache');
		await cache.save('redoc');
	}
});



export { extension };
