import type { NetlifyPluginUtils } from '@netlify/build';
import { existsSync } from 'node:fs';

type CliCommand = NetlifyPluginUtils['run']['command'];

export async function downloadPersistenceModule(
	command: CliCommand,
): Promise<void> {
	const isModuleDownloaded = existsSync(`${process.cwd()}/docs-worker-pool`);

	if (isModuleDownloaded) return;

	await command(
		'git clone --depth 1 --filter=tree:0 https://github.com/mongodb/docs-worker-pool.git --sparse',
	);

	await command('git sparse-checkout set --no-cone modules/persistence', {
		cwd: `${process.cwd()}/docs-worker-pool`,
	});

	await command('npm ci', {
		cwd: `${process.cwd()}/docs-worker-pool/modules/persistence`,
	});

	await command('npm run build', {
		cwd: `${process.cwd()}/docs-worker-pool/modules/persistence`,
	});
}
