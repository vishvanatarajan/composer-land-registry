#!/bin/bash

CURRENT_DIR="${0%/*}"
COMPOSER_DIR="/composer"
RELATIVE_COMPOSER_PATH="$CURRENT_DIR$COMPOSER_DIR"
RED="\033[0;31m"
GREEN="\033[0;32m"

if cd $RELATIVE_COMPOSER_PATH; then
    export FABRIC_VERSION="hlfv12"
    export FABRIC_START_TIMEOUT="15"
    if ./stopFabric.sh; then
        if ./teardownFabric.sh; then
            if ./teardownAllDocker.sh; then
                printf "${GREEN}Blockchain network has been uninstalled successfully!\n"
                exit 0
            else
                printf "${RED}Error while tearing down Docker\n"
                exit 2
            fi
        else
            printf "${RED}Error while tearing down Fabric\n"
            exit 2
        fi
    else
        printf "${RED}Error while stopping Fabric\n"
        exit 2
    fi
else
    printf "${RED}Composer directory not found\n"
    exit 2
fi
