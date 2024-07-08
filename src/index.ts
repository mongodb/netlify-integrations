// Documentation: https://sdk.netlify.com
import { NetlifyIntegration } from "@netlify/sdk";

const integration = new NetlifyIntegration();

integration.addBuildEventHandler("onPreBuild", () => {
  console.log("Hello there.");
});
  
export { integration };

