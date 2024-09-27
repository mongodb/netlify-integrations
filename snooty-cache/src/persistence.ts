import type { NetlifyPluginUtils } from '@netlify/build';
import { existsSync } from 'node:fs';

export async function downloadPersistenceModule(
	run: NetlifyPluginUtils['run'],
): Promise<void> {
	const isModuleDownloaded = existsSync(`${process.cwd()}/docs-worker-pool`);

	if (isModuleDownloaded) return;

	await run.command(
		'git clone --depth 1 --filter=tree:0 https://github.com/mongodb/docs-worker-pool.git --sparse',
	);

	await run.command('git sparse-checkout set --no-cone modules/persistence', {
		cwd: `${process.cwd()}/docs-worker-pool`,
	});

	await run.command('npm ci', {
		cwd: `${process.cwd()}/docs-worker-pool/modules/persistence`,
	});

	await run.command('npm run build', {
		cwd: `${process.cwd()}/docs-worker-pool/modules/persistence`,
	});
}
