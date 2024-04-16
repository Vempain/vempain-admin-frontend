# Vempain admin frontend

See [documentation](development.md) for development processes and guidelines.

## Prerequisites

To run the frontend in production, you need a web server that can serve static files. For development, you need Node.js and npm.

## Setting up development environment

### ENV files

Copy and modify appropriately the `.env` to `.env.local`, `.env.stage` and `.env.prod` as these are used to run the `yarn start`,
`yarn build:stage` and `yarn build:production` scripts.

Run `yarn install` to install the necessary npm packages.

Now you can start up the local development environment with the command `yarn start`.
