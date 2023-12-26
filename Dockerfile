ARG NODE_VERSION=18.19.0

# Base Image
FROM node:${NODE_VERSION}-bookworm as base
RUN mkdir -p /opt/app
WORKDIR /opt/app
COPY . ./
RUN npm install 
RUN ["./bin/build-site.sh"]
#RUN apk add --no-cache tree
RUN apt-get update && apt-get -y install \
    tree wget
RUN tree -fi

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

#Run TiddlyWiki
#FROM node:${NODE_VERSION}-alpine as run
#EXPOSE 8080
#WORKDIR /opt/app
#RUN mkdir -p ./boot
#COPY --from=base /opt/app/output .
#COPY --from=base /opt/app/boot ./boot/
#COPY --from=base /opt/app/package.json .
#RUN apk add --no-cache tree
#RUN tree -fi
#CMD [ "node", "./tiddlywiki.js", "--init", "server"]
#CMD [ "node", "tiddlywiki", "--listen"]
#CMD [ "/bin/sh"]

FROM nginx:1.25.3-alpine as run
EXPOSE 80
EXPOSE 443
COPY --from=base /opt/app/output /usr/share/nginx/html
WORKDIR /usr/share/nginx/html
CMD ["nginx"]
