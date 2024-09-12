import { NetlifyIntegration } from "@netlify/sdk";

const integration = new NetlifyIntegration();

integration.addBuildEventHandler("onSuccess", ({utils: {status, git}}) => {
  console.log("Checking if any files changed on git -----");
  console.log('Modified files:', git.modifiedFiles);

  const markdownList = []
  for (const modifiedFile of git.modifiedFiles) {
    if (modifiedFile.includes('source') && (!modifiedFile.includes('/images') || !modifiedFile.includes('/includes') || !modifiedFile.includes('/examples'))) {
      let shortform = modifiedFile.replace('source', '');
      shortform = shortform.replace('.txt', '');
      markdownList.push(`[${modifiedFile}](${process.env.DEPLOY_PRIME_URL + shortform})`);
    }
  }

  if (markdownList.length !== 0) {
    status.show({
      title: `URLs to Changed Files`,
      summary: markdownList.join("\n"),
    });
  }
});

export { integration };
