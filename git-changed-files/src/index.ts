import { NetlifyIntegration } from "@netlify/sdk";

const integration = new NetlifyIntegration();

integration.addBuildEventHandler("onSuccess", ({utils: {status, git}}) => {
  console.log("Checking if any files changed on git -----");
  if (git.modifiedFiles.length !== 0) {
    const arr =  git.modifiedFiles;
    const newArr = (process.env.REPOSITORY_URL + arr.join(';' + process.env.REPOSITORY_URL)).split(';');
    console.log('Modified files:', git.modifiedFiles, process.env.REPOSITORY_URL);
    console.log(newArr);
  }

  status.show({
    title: `Changed Files`,
    summary: git.modifiedFiles.join("\n"),
  });
});

export { integration };
