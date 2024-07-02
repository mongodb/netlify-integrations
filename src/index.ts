// Documentation: https://sdk.netlify.com
import { NetlifyIntegration } from "@netlify/sdk";
import type { ExecaChildPromise, ExecaReturnValue } from "execa";
import { ChildProcess } from "child_process";

// Added this type to get SOME intellisense
type ExecaChildProcess<StdoutErrorType = string> = ChildProcess &
  ExecaChildPromise<StdoutErrorType> &
  Promise<ExecaReturnValue<StdoutErrorType>>;
const integration = new NetlifyIntegration();

integration.addBuildEventHandler("onPostBuild", async ({ utils: { run } }) => {
  const result: ExecaChildProcess = await run.command(
    "unzip bundle.zip -d bundle"
  );

  console.log("stdin: ", result.stdin);
});

export { integration };
