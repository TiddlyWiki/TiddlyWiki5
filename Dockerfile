ARG NODE_VERSION=18.0.0

# Base Image
FROM node:${NODE_VERSION}-alpine as base
RUN mkdir -p /opt/app
WORKDIR /opt/app
COPY package.json .
RUN npm install
COPY . .

# Playwright Tests
FROM mcr.microsoft.com/playwright:focal as playwright-tests
ENV CI=true
WORKDIR /opt/app
COPY package*.json ./
RUN npm install @playwright/test
COPY . .
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
CMD [ "npm", "run", "dev"]
