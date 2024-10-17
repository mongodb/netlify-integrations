// Documentation: https://sdk.netlify.com
import { NetlifyExtension, type BuildHookType } from '@netlify/sdk';

export class Extension extends NetlifyExtension {
  extensionEnabled: boolean;

  constructor(envVar: string | undefined) {
    super();
    console.log(envVar, typeof envVar, envVar === 'true');
    this.extensionEnabled = envVar === 'true';
  }
}
