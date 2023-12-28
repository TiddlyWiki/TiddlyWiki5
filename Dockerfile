ARG NODE_VERSION=18.19.0

# Base Image
FROM node:${NODE_VERSION}-bullseye-slim as base
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init
WORKDIR /usr/src/app
COPY package*.json /usr/src/app/
COPY . /usr/src/app/
RUN npm ci --only=production

#RUN mkdir -p /opt/app
#WORKDIR /opt/app
#COPY . ./
#RUN npm install
#RUN ["./bin/build-site.sh"] #if we want html files.
#RUN apk add --no-cache tree
#RUN apt-get update && apt-get -y install \
    #tree wget
#RUN tree -fi
#RUN find . -iname \tid*

# Playwright Tests
FROM mcr.microsoft.com/playwright:focal as playwright-tests
ENV CI=true
RUN mkdir -p /opt/app
WORKDIR /opt/app
COPY . ./
RUN ["./bin/ci-test.sh"]

#Jasmine Tests
FROM node:${NODE_VERSION}-alpine as jasmine-tests
RUN mkdir -p /opt/app
WORKDIR /opt/app
COPY . ./
RUN apk add chromium
ENV CHROME_BIN=/usr/bin/chromium-browser
RUN npm run test

#Run TiddlyWiki with nodejs backend
FROM node:${NODE_VERSION}-bullseye-slim as run
ENV NODE_ENV production
COPY --from=build /usr/bin/dumb-init /usr/bin/dumb-init
USER node
WORKDIR /usr/src/app
EXPOSE 8080
#WORKDIR /opt/app
COPY --chown=node:node --from=base /usr/src/app/node_modules /usr/src/app/node_modules
COPY --chown=node:node . /usr/src/app
CMD ["dumb-init", "node", "tiddlywiki.js"]
#RUN mkdir -p ./boot
#COPY --from=base /opt/app/tiddlywiki.js .
#COPY --from=base /opt/app/node_modules ./node_modules/
#COPY --from=base /opt/app/boot ./boot/
#COPY --from=base /opt/app/package.json .
#RUN apk add --no-cache tree
#RUN tree -fi
#CMD [ "node", "./tiddlywiki.js", "--init", "server"]
#CMD [ "node", "tiddlywiki", "--listen"]
#CMD [ "/bin/sh"]

#Simple html image
#FROM nginx:alpine as run
#EXPOSE 80
#EXPOSE 443
#COPY --from=base /opt/app/output /usr/share/nginx/html
#COPY --from=base /opt/app/output/empty.html /usr/share/nginx/html/index.html
