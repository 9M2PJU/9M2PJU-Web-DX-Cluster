FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install runtime libraries and temporary build dependencies.
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libmariadb3 \
    libev4 \
    && apt-get install -y --no-install-recommends \
    gcc \
    pkg-config \
    libmariadb-dev \
    libffi-dev \
    libev-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./

# piwheels avoids long NumPy/Pandas builds on ARM.
RUN pip3 install --extra-index-url https://www.piwheels.org/simple -r requirements.txt && \
    apt-get purge -y --auto-remove \
    gcc \
    pkg-config \
    libmariadb-dev \
    libffi-dev \
    libev-dev \
    build-essential && \
    rm -rf /var/lib/apt/lists/* /root/.cache/pip

COPY . ./

# Pre-compress static assets to save CPU at runtime.
RUN find /app/static -type f -exec gzip -9 -k {} +

EXPOSE 8080

RUN chmod +x entrypoint.sh
ENTRYPOINT ["/bin/bash", "entrypoint.sh"]
