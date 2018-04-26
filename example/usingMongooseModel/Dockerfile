FROM node:8.9.1-slim
MAINTAINER Ted Cheng <ted@shoplineapp.com>

ENV APP_DIR=/app

COPY package.json $APP_DIR/package.json

RUN cd $APP_DIR \
    && npm install \
    && npm install -g mocha \
                      forever \
    && apt-get update \ 
    && apt-get install -y netcat

COPY . $APP_DIR

WORKDIR $APP_DIR

EXPOSE 3000

CMD ["forever", "-a", "-o", "/tmp/out.log", "-e", "/tmp/err.log", "--watch", "--watchDirectory", "./api", "server.js"]
