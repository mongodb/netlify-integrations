// Documentation: https://sdk.netlify.com
import { Extension } from './extension';
import { updateConfig } from './updateConfig';

const extension = new Extension({
  isEnabled: JSON.parse(
    process.env.POPULATE_METADATA_ENABLED ?? 'false',
  ) as boolean,
});

extension.addBuildEventHandler('onPreBuild', async (netlifyConfig) => {
  await updateConfig(netlifyConfig);
});

export { extension };
