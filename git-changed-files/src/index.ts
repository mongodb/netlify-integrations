import { NetlifyIntegration } from "@netlify/sdk";

const integration = new NetlifyIntegration();

integration.addBuildEventHandler("onSuccess", ({utils: {status, git}}) => {
  console.log("Checking if any files changed on git -----");
  if (git.modifiedFiles.length !== 0) {
    console.log('Modified files:', git.modifiedFiles)
  }

  status.show({
    title: `Changed Files`,
    summary: git.modifiedFiles.join("\n"),
  });
});

export { integration };
