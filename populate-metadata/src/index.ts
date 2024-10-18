// Documentation: https://sdk.netlify.com
import { NetlifyExtension } from '@netlify/sdk';
import { getProperties } from './getProperties';
import { Extension } from './initialization';
import { updateConfig } from './updateConfig';

const extension = new Extension(process.env.POPULATE_METADATA_ENABLED);

extension.addBuildEventHandler(
  'onPreBuild',
  async ({ netlifyConfig }) => {
    updateConfig(netlifyConfig);
  },
  { if: () => extension.extensionEnabled },
);

export { extension };
