ARG NODE_VERSION=18.19.0

# Base Image
FROM node:${NODE_VERSION}-bookworm as base
RUN mkdir -p /opt/app
WORKDIR /opt/app
COPY . ./
RUN npm install

#RUN ["./bin/build-site.sh"] #if we want html files.
#RUN apk add --no-cache tree
RUN apt-get update && apt-get -y install \
    tree wget
RUN tree -fi
RUN find . -iname \tid*

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
FROM node:${NODE_VERSION}-alpine as run
EXPOSE 8080
WORKDIR /opt/app
RUN mkdir -p ./boot
COPY --from=base /opt/app/tiddlywiki.js .
COPY --from=build /opt/app/node_modules .
COPY --from=base /opt/app/boot ./boot/
COPY --from=base /opt/app/package.json .
RUN apk add --no-cache tree
RUN tree -fi
#CMD [ "node", "./tiddlywiki.js", "--init", "server"]
#CMD [ "node", "tiddlywiki", "--listen"]
CMD [ "/bin/sh"]

#Simple html image
#FROM nginx:alpine as run
#EXPOSE 80
#EXPOSE 443
#COPY --from=base /opt/app/output /usr/share/nginx/html
#COPY --from=base /opt/app/output/empty.html /usr/share/nginx/html/index.html
