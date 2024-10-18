// Documentation: https://sdk.netlify.com
import { NetlifyExtension } from '@netlify/sdk';
import { getProperties } from './getProperties';
import { Extension } from './initialization';
import { updateConfig, updateConfigReal } from './updateConfig';

const extension = new Extension(process.env.POPULATE_METADATA_ENABLED);
if (extension.extensionEnabled) {
  extension.addBuildEventHandler('onPreBuild', async ({ netlifyConfig }) =>
    updateConfig(),
  );
}

extension.addBuildEventHandler('onPreBuild', async ({ netlifyConfig }) => {
  console.log('Hello');
  updateConfigReal(netlifyConfig);
});

export { extension };
