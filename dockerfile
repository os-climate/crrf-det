FROM python:3.11-slim
RUN apt-get update && apt-get install -y build-essential cmake ninja-build libpng-dev zlib1g-dev libjpeg-dev libopenjp2-7-dev libfreetype-dev libfontconfig-dev libtiff-dev libnss3-dev liblcms2-dev poppler-utils
COPY docmt /docmt
WORKDIR /docmt
RUN ./build-release.sh
COPY src/requirements.txt /root/
RUN export MAKEFLAGS="-j$(nproc)" && pip install -r /root/requirements.txt
WORKDIR /det
CMD ["sanic", "det.app"]
