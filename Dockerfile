ARG NODE_VERSION=21.6.0
ARG WIKI_NAME="mywiki"

# Base Image
FROM node:${NODE_VERSION}-alpine as base
WORKDIR /usr/src/app
RUN apk add dumb-init
RUN apk add curl
COPY package.json .
RUN npm install
COPY . /usr/src/app/

# Playwright Tests
FROM mcr.microsoft.com/playwright:focal as playwright-tests
ENV CI=true
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install @playwright/test
COPY . /usr/src/app/
RUN npx playwright install --with-deps
RUN ["npx", "playwright", "test"]
RUN npm install
RUN npx playwright install

#Jasmine Tests
FROM base as jasmine-tests
RUN apk add chromium
ENV CHROME_BIN=/usr/bin/chromium-browser
RUN npm run test

#Run TiddlyWiki
FROM base as run
EXPOSE 8080
COPY --from=base /usr/bin/dumb-init /usr/bin/dumb-init
USER node
WORKDIR /usr/src/app
COPY --chown=node:node --from=base /usr/src/app/node_modules /usr/src/app/node_modules
COPY --chown=node:node . /usr/src/app
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "./tiddlywiki.js", "./editions/server", "--listen", "host=0.0.0.0"] 
