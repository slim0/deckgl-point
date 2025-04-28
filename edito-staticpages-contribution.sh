#!/usr/bin/bash

SCRIPT_DIR=$( dirname $(readlink -f "${BASH_SOURCE[0]}") )
pushd $SCRIPT_DIR > /dev/null

which node
returnValue=$?
if [ $returnValue -ne 0 ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash
    \. "$HOME/.nvm/nvm.sh"
    nvm install 22
    echo "Node version: `node -v`"
    echo "Node current version: `nvm current`"
    echo "NPM version: `npm -v`"
    echo "Install Yarn"
    npm install --global yarn
    echo "Yarn installed"
fi

yarn --cwd repository build

popd > /dev/null