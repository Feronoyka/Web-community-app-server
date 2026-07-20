## Description

Web community app built on stack: NestJs, postgreSQL, typeORM, Socket.io, RESTful API, JWT auth, with complete e2e test on Jest

## System atchitecture of backend

<img width="8619" height="5556" alt="System-architecture-of-ventus-forum" src="https://github.com/user-attachments/assets/3eecc2cf-54c5-4ad5-a5bf-1a002b8329f7" />


## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# First compile
npm run build
# make sure that dist folder appeared if npm run built doesn't work use:
npx tsc

# Then run in dev mode
$ npm run start:dev
```

Actually running in dev mode doesn't require dist folder after compiling, but cause of issue in nestJs without dist folder can't run in dev mode, so you must have dist folder

## Run tests

There is no unit test so only e2e tests

```bash
# e2e tests
$ npm run test:e2e
```

## Run docker

```
Docker compose up
```

## Deployment

Deploy this project on service where support typeORM for example on Digital Ocean

## NOTE

In nest-cli.json file the `deleteOutDir: false`, it means if set true the Project won't run in dev mode, by default running on dev doesn't require dist file but I tried many attempts to solve this

In `package.json nest build` by default doesn't work, It doesn't compile so I changed the value from `nest build` to `npx tsc`
