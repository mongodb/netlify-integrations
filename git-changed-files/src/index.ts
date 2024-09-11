import { NetlifyIntegration } from "@netlify/sdk";

const integration = new NetlifyIntegration();

integration.addBuildEventHandler("onSuccess", ({utils: {status, git}}) => {
  console.log("Checking if any files changed on git -----");
  if (git.modifiedFiles.length !== 0) {
    const arr =  git.modifiedFiles;
    // const pre = process.env.REPOSITORY_URL + '/blob/' + process.env.HEAD + '/';
    const pre = process.env.URL + '/';
    const newArr = (pre + arr.join(';' + pre)).split(';');
    console.log('Modified files:', git.modifiedFiles);
  
    const markdownList = []
    for (let i = 0; i < git.modifiedFiles.length; i++) {
      if (git.modifiedFiles[i].includes('source')) {
        if (!git.modifiedFiles[i].includes('/images') || !git.modifiedFiles[i].includes('/includes') || !git.modifiedFiles[i].includes('/examples')) {
          markdownList.push(`[${git.modifiedFiles[i]}](${newArr[i]})`);
        }
      }
    }

    if (markdownList.length !== 0) {
      status.show({
        title: `URLs to Changed Files`,
        summary: markdownList.join("\n"),
      });
    }
  }
});

export { integration };
