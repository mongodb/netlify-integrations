// Documentation: https://sdk.netlify.com
import { NetlifyExtension } from '@netlify/sdk';
import { downloadPersistenceModule } from './persistence';

const extension = new NetlifyExtension();
const ZIP_PATH = `${process.cwd()}/bundle/documents`;


function main() {

if (process.env.EXTENSION_DISABLED && process.env.EXTENSION_DISABLED === 'true') return;

	extension.addBuildEventHandler(
		'onPreBuild',
		async ({ utils: {  run } }) => {
			try {
				await downloadPersistenceModule(run);
			} catch (e) {
				console.error('Unable to run the persistence module', e);
			}
		},
	);
}

main()

export { extension };
