Running Netlify Extensions Locally
Testing an extension locally is a great way to ensure your changes work as intended without needing to deploy directly to production. By default, Netlify Extensions will be deployed automatically to production when merged to main. This makes testing locally important.

First, you’ll want to use a content repository to test the extension, if the extension you’re working with uses build handlers. Right now, all of our extensions, except for the Slack deploy extension, use build handlers.

If you haven’t already, make sure you have the Netlify CLI installed:

npm install netlify-cli -g

Once installed, clone the content repository, and make

PARSER_VERSION=0.18.3

# This make command curls the examples for certain repos.

# If the rule doesn't exist, the error doesn't interrupt the build process.

make examples

if [ ! -d "snooty-parser" ]; then
echo "snooty parser not installed, downloading..."
curl -L -o snooty-parser.zip https://github.com/mongodb/snooty-parser/releases/download/v${PARSER_VERSION}/snooty-v${PARSER_VERSION}-linux_x86_64.zip
unzip -d ./snooty-parser snooty-parser.zip
chmod +x ./snooty-parser/snooty
fi

echo "======================================================================================================================================================================="
echo "========================================================================== Running parser... =========================================================================="
./snooty-parser/snooty/snooty build . --output=./bundle.zip
echo "========================================================================== Parser complete ============================================================================"
echo "======================================================================================================================================================================="

if [ ! -d "snooty" ]; then
echo "snooty frontend not installed, downloading"
git clone -b netlify-poc --depth 1 https://github.com/mongodb/snooty.git
echo GATSBY_MANIFEST_PATH=$(pwd)/bundle.zip >> ./snooty/.env.production
cd snooty
npm ci --legacy-peer-deps
git clone --depth 1 https://github.com/mongodb/docs-tools.git ./snooty/docs-tools
mkdir -p ./snooty/static/images
mv ./snooty/docs-tools/themes/mongodb/static ./static/docs-tools
mv ./snooty/docs-tools/themes/guides/static/images/bg-accent.svg ./static/docs-tools/images/bg-accent.svg
fi

if [ -d "docs-worker-pool" ]; then
node --unhandled-rejections=strict docs-worker-pool/modules/persistence/dist/index.js --path bundle.zip --githubUser netlify
fi

cd snooty && npm run build:no-prefix

Debugging Common Issues

Site has incorrect or no netlify.toml file
The way this manifests is the Netlify build failing with the following error in the deploy stage:

This stems from Netlify uploading all files within the directory, but not uploading the snooty/public output. In the case of not having a netlify.toml, make sure their branch is up-to-date with their master branch.

Although less likely, writers may have an incorrectly configured netlify.toml. Namely, there were some instances where the netlify.toml was out-of-date. Instead of containing the [build] section to specify the publish directory and build command, I instead used the [context.production] section. This meant that the build script was never run in deploy previews or branch deploys.

An example of updating an out-of-date netlify.toml

Error: Couldn't find temp query result for "X”

This error stems from the Netlify workers running out of memory. This is usually remedied by clearing the cache of the Netlify site.

Example of this issue occurring

Builds not starting even when writers create a PR
This occurs when the branch they are creating a PR against is not added as a deployable branch in Netlify.
