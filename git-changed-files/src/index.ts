import { NetlifyIntegration } from "@netlify/sdk";

const integration = new NetlifyIntegration();

integration.addBuildEventHandler("onSuccess", ({utils: {status, git}}) => {
  console.log("Checking if any files changed on git -----");
  if (git.modifiedFiles.length !== 0) {
    const arr =  git.modifiedFiles;
    const pre = process.env.REPOSITORY_URL + '/blob/' + process.env.HEAD + '/';
    const newArr = (pre + arr.join(';' + pre)).split(';');
    console.log('Modified files:', git.modifiedFiles, process.env.REPOSITORY_URL);
    console.log(newArr);
    console.log(process.env.BRANCH, process.env.HEAD);
  

    status.show({
      title: `Changed Files`,
      summary: newArr.join("\n"),
    });
  }
});

export { integration };
