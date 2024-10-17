// Documentation: https://sdk.netlify.com
import { NetlifyExtension, type BuildHookType } from '@netlify/sdk';

export class Extension extends NetlifyExtension {
  extensionEnabled: boolean;

  constructor() {
    super();
    this.extensionEnabled = !!process.env;
  }
}
