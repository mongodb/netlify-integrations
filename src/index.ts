// Documentation: https://sdk.netlify.com
import { NetlifyIntegration } from "@netlify/sdk";

const integration = new NetlifyIntegration();

integration.addBuildEventHandler("onSuccess", async ({ utils: { run } }) => {
  console.log("=========== Chatbot Data Upload Integration ================");
  await run.command("unzip bundle.zip -d bundle");

  console.log("=========== Chatbot Data Upload Integration ================");
});

export { integration };
