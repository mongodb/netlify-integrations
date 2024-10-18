// Documentation: https://sdk.netlify.com
import { NetlifyExtension } from '@netlify/sdk';
import { getProperties } from './getProperties';
import { Extension } from './initialization';
import { updateConfig } from './updateConfig';

const extension = new Extension(process.env.POPULATE_METADATA_ENABLED);
// if (extension.extensionEnabled) {
//   extension.addBuildEventHandler('onPreBuild', async ({ netlifyConfig }) =>
//     updateConfig(netlifyConfig),
//   );
// }

extension.addBuildEventHandler(
  'onPreBuild',
  async ({ netlifyConfig }) => {
    updateConfig(netlifyConfig);
  },
  { if: () => process.env.POPULATE_METADATA_ENABLED === 'true' },
);

export { extension };
