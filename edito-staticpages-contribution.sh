#!/usr/bin/bash

SCRIPT_DIR=$( dirname $(readlink -f "${BASH_SOURCE[0]}") )
pushd $SCRIPT_DIR > /dev/null

which node
returnValue=$?
if [ $returnValue -ne 0 ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash
    \. "$HOME/.nvm/nvm.sh"
    nvm install 22
    node -v
    nvm current
    npm -v
    npm i yarn
fi

yarn build

popd > /dev/null