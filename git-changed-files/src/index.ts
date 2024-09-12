import { NetlifyIntegration } from "@netlify/sdk";

const integration = new NetlifyIntegration();

integration.addBuildEventHandler("onSuccess", ({utils: {status, git}}) => {
  console.log("Checking if any files changed on git -----");
  console.log('Modified files:', git.modifiedFiles);

  const markdownList = createMarkdown(git.modifiedFiles);

  if (markdownList.length !== 0) {
    status.show({
      title: `URLs to Changed Files`,
      summary: markdownList.join("\n"),
    });
  }
});

/**
 * Function to convert git modifed files to links of the staged files. Needs to be in markdown
 * so on the deploy summary the text appears as a link not just as text.
 *
 * @param modifiedFiles
 */
export function createMarkdown(modifiedFiles: readonly string[]) {
  const markdownList = []
  for (const modifiedFile of modifiedFiles) {
    if (modifiedFile.includes('source') && (!modifiedFile.includes('/images') || !modifiedFile.includes('/includes') || !modifiedFile.includes('/examples'))) {
      let shortform = modifiedFile.replace('source', '');
      shortform = shortform.replace('.txt', '');
      markdownList.push(`[${modifiedFile}](${process.env.DEPLOY_PRIME_URL + shortform})`);
    }
  }

  return markdownList;
}

export { integration };
