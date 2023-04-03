# Adapted from: https://github.com/elasticdog/tiddlywiki-docker/blob/master/5/Dockerfile

ARG NODE_LTS_VERSION=18

FROM node:${NODE_LTS_VERSION}-alpine

ARG TIDDLYWIKI_VERSION=5.2.7
ARG TIDDLYWIKI_DATA_DIR=/tiddlywiki
ARG TIDDLYWIKI_PORT=8080

# https://github.com/nodejs/docker-node/blob/master/docs/BestPractices.md#handling-kernel-signals
RUN apk add --no-cache tini
RUN npm install -g tiddlywiki@${TIDDLYWIKI_VERSION}

EXPOSE ${TIDDLYWIKI_PORT}

VOLUME ${TIDDLYWIKI_DATA_DIR}
WORKDIR ${TIDDLYWIKI_DATA_DIR}

ENTRYPOINT ["/sbin/tini", "--", "tiddlywiki"]
CMD ["--help"]