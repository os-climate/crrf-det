FROM python:3.11-slim
RUN apt-get update && apt-get install -y curl build-essential cmake ninja-build libpng-dev zlib1g-dev libjpeg-dev libopenjp2-7-dev libfreetype-dev libfontconfig-dev libtiff-dev libnss3-dev liblcms2-dev poppler-utils libjpeg-turbo-progs && curl -fsSL https://deb.nodesource.com/setup_19.x | bash - && apt-get install -y nodejs
COPY docmt /docmt
WORKDIR /docmt
RUN ./build-release.sh
COPY src/requirements.txt /root/
RUN export MAKEFLAGS="-j$(nproc)" && pip install -r /root/requirements.txt
COPY src/search /search
WORKDIR /search
RUN npm i && npm i -g .
WORKDIR /det
CMD ["sanic", "det.app"]
