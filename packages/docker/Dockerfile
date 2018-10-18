FROM node:8

RUN DEBIAN_FRONTEND=noninteractive \
  apt-get update \
  && apt-get install -y apt-utils \
  && apt-get install --assume-yes --no-install-recommends \
  build-essential \
  nasm \
  vim-common \
  curl \
  unzip \
  wget \
  git \
  python2.7\
  && useradd -m -s /bin/false nxbm \
  && mkdir -p /scripts /nxbm /build /data

COPY init.sh /scripts
COPY getLatest.sh /scripts
RUN chmod +x /scripts/*.sh \
  && chown -R nxbm:nxbm /scripts /nxbm /build /data

USER nxbm
WORKDIR /nxbm

EXPOSE 9999

ENV NODE_DOCKER=true
ENV NODE_ENV=production
ENV PORT=9999
ENV ROOT_DIR=/nxbm
ENV DATA_DIR=/data
VOLUME /data

ENTRYPOINT [ "/scripts/init.sh" ]