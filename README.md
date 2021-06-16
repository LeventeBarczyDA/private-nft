# private-nft
Private Non-fungible Tokens

## Pre-reqs: 

- Daml sdk 
- yarn 
- make 
- A browser

## Build 

```sh
make clean
make build 
make deploy 
```

## Deployment to Sandbox 

Start two terminal windows.

### Sandbox, Json API, Navigator

```sh 
cd nft
daml start 
```
This will start the sandbox and json api on localhost:6865, and the navigator is served to localhost:7575, and should open in a browser.

```sh
cd ui
yarn start 
```
This will start yarn's development server on localhost:3000, and should open in a browser tab.


## Deployment to Hub.daml.com

