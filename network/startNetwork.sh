#!/bin/bash

CURRENT_DIR="${0%/*}"
COMPOSER_DIR="/composer"
RELATIVE_COMPOSER_PATH="$CURRENT_DIR$COMPOSER_DIR"
COMPOSER_PORT="8000"
RED="\033[0;31m"
BNA_FILE_NAME="land-registry-network.bna"
PEER_ADMIN_CARD="PeerAdmin@hlfv1"
NETWORK_NAME="land-registry-network"
NETWORK_VERSION="0.2.6-deploy.2"
NETWORK_ADMIN="admin"
NETWORK_ADMIN_ENROLL_SECRET="adminpw"
NETWORK_CARD_FILE="admin.card"
NETWORK_CARD="admin@land-registry-network"

if [ "$1" != "" ]; then
    COMPOSER_PORT=$1
fi

if cd $RELATIVE_COMPOSER_PATH; then
    export FABRIC_VERSION="hlfv12"
    export FABRIC_START_TIMEOUT="15"
    if ./downloadFabric.sh; then
        ./createPeerAdminCard.sh;
        if ./startFabric.sh; then
            if composer network install --archiveFile $BNA_FILE_NAME --card $PEER_ADMIN_CARD; then
                if composer network start --networkName $NETWORK_NAME --networkVersion $NETWORK_VERSION --networkAdmin $NETWORK_ADMIN --networkAdminEnrollSecret $NETWORK_ADMIN_ENROLL_SECRET --card $PEER_ADMIN_CARD --file $NETWORK_CARD_FILE; then
                    composer card import --file $NETWORK_CARD_FILE;
                    if composer network ping --card $NETWORK_CARD; then
                        if composer-playground -p $COMPOSER_PORT; then
                            exit 0
                        else
                            printf "${RED}Error while starting composer playground\n"
                            exit 2
                        fi
                    else
                        printf "${RED}Error while pinging Composer business network\n"
                        exit 2
                    fi
                else
                    printf "${RED}Error while starting Composer business network\n"
                    exit 2
                fi
            else
                printf "${RED}Error while installing Composer business network\n"
                exit 2
            fi
        else
            printf "${RED}Fabric could not be started\n"
            exit 2
        fi
    else
        printf "${RED}Fabric could not be downloaded\n"
        exit 2
    fi
else
    printf "${RED}Composer directory not found\n"
    exit 2
fi