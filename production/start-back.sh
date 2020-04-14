#!/bin/sh

# This bash file is intended to be run with the pitit-bac's root as
# active directory.

# Loads NVM
. /path/to/.nvm/nvm.sh

# Uses the correct NodeJS version (you may have to install the correct
# version manually before running this script, using `nvm install`)
nvm use

# Starts the backend server
make start-back-production
