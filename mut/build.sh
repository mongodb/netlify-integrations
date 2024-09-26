MUT_VERSION=0.11.4


echo "current dir ${PWD}"



if [ ! -d "mut" ]; then
    echo "mut not installed, downloading..."
    curl -L -o mut.zip https://github.com/mongodb/mut/releases/download/v${MUT_VERSION}/mut-v${MUT_VERSION}-linux_x86_64.zip
    unzip -d . mut.zip
fi

cd docs-cpp-master
ls -a

mut-redirects config/redirects -o .htaccess
    



