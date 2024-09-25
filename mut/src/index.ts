// Documentation: https://sdk.netlify.com
import { NetlifyExtension } from "@netlify/sdk";

const extension = new NetlifyExtension();

extension.addBuildEventHandler("onSuccess", async () => {});

export { extension };
