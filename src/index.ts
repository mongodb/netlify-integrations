// Documentation: https://sdk.netlify.com
import { NetlifyIntegration } from "@netlify/sdk";

const integration = new NetlifyIntegration();

integration.addBuildEventHandler("onSuccess", () => {
  console.log("Hello there.");
});

export { integration };
