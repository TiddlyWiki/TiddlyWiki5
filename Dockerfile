ARG NODE_LTS_VERSION=24

FROM node:${NODE_LTS_VERSION}-alpine

# Build arguments (overridable at build time)
ARG TIDDLYWIKI_DATA_DIR=/data
ARG TIDDLYWIKI_PORT=8080

# Runtime environment variables
ENV TIDDLYWIKI_DATA_DIR=${TIDDLYWIKI_DATA_DIR} \
    TIDDLYWIKI_PORT=${TIDDLYWIKI_PORT} \
    TIDDLYWIKI_HOST=0.0.0.0 \
    TIDDLYWIKI_USERNAME="" \
    TIDDLYWIKI_PASSWORD="" \
    TIDDLYWIKI_READERS="(anon)" \
    TIDDLYWIKI_WRITERS="(authenticated)"

WORKDIR /app

# Install production dependencies only (no network install of tiddlywiki itself)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy only runtime files and server init editions
COPY tiddlywiki.js ./
COPY boot ./boot
COPY core ./core
COPY languages ./languages
COPY plugins ./plugins
COPY themes ./themes
COPY editions/server ./editions/server
COPY editions/server-external-js ./editions/server-external-js

# Symlink CLI so 'tiddlywiki' is available on PATH
RUN chmod +x tiddlywiki.js && \
    ln -s /app/tiddlywiki.js /usr/local/bin/tiddlywiki

# Create unprivileged user with fixed UID/GID 1000 (matches the default first user
# on most Linux hosts, so bind-mounted directories work without --user override)
RUN addgroup -g 1000 -S tiddlywiki && \
    adduser -u 1000 -S -G tiddlywiki tiddlywiki && \
    mkdir -p "${TIDDLYWIKI_DATA_DIR}" && \
    chown tiddlywiki:tiddlywiki "${TIDDLYWIKI_DATA_DIR}"

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER tiddlywiki
WORKDIR ${TIDDLYWIKI_DATA_DIR}

EXPOSE ${TIDDLYWIKI_PORT}

# Use Docker's built-in init process (docker run --init / compose: init: true)
ENTRYPOINT ["/entrypoint.sh"]
