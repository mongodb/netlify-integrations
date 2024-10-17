import { NetlifyExtension } from '@netlify/sdk';
import { getProperties } from './getProperties';

export const updateConfig = async () => {
  // If the build event handler is not enabled on given site, return early

  if (process.env.POPULATE_METADATA_ENABLED !== 'true') {
    return;
  }
  console.log('In update config function');
};
