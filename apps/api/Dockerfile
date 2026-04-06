FROM node:20-bookworm-slim
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-pip python3-venv build-essential \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir --upgrade pip \
  && pip install --no-cache-dir pandas==2.2.3 numpy==2.1.2 scikit-learn==1.5.2 joblib==1.4.2 openpyxl==3.1.5
COPY . .
RUN mkdir -p /srv/churn-platform/storage/onboarding /srv/churn-platform/storage/training-artifacts /srv/churn-platform/services/ml-training
ENV NODE_ENV=production
EXPOSE 8000
CMD ["npm", "start"]
