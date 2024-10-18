// Documentation: https://sdk.netlify.com
import {
  NetlifyExtension,
  type BuildHookOptions,
  type BuildHookType,
  type BuildHookWithContext,
} from '@netlify/sdk';
import type z from 'zod';
import type { NetlifyPluginOptions } from '@netlify/build';

export const envVarToBool = (envVar: 'false') => {
  JSON.parse(envVar) as boolean;
};

export type ExtensionOptions = {
  isEnabled: boolean;
};
export class Extension<
  BuildContext extends z.ZodSchema = z.ZodUnknown,
  BuildConfigSchema extends z.ZodSchema = z.ZodUnknown,
> extends NetlifyExtension<
  z.ZodUnknown,
  z.ZodUnknown,
  BuildContext,
  // In case of issues, double check that BuildConfigSchema is in correct spot in order of type params
  BuildConfigSchema,
  z.ZodUnknown
> {
  isEnabled: boolean;

  constructor({ isEnabled }: ExtensionOptions) {
    super();
    this.isEnabled = isEnabled;
    console.log('Extension enabled:', this.isEnabled);
  }

  addBuildEventHandler = (
    type: BuildHookType,
    func: BuildHookWithContext<
      Zod.infer<BuildContext>,
      Zod.infer<BuildConfigSchema>
    >,
    options?: BuildHookOptions,
  ): void => {
    super.addBuildEventHandler(
      type,
      async (args) => {
        func(args);
      },
      {
        ...options,
        if: (buildConfig) => {
          if (!this.isEnabled) {
            return false;
          }
          return options?.if === undefined || options.if(buildConfig);
        },
      },
    );
  };
}
