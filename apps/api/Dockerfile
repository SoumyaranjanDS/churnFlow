FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache python3 py3-pip
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
RUN pip3 install --no-cache-dir pandas==2.2.3 numpy==2.1.2 scikit-learn==1.5.2 joblib==1.4.2 openpyxl==3.1.5
COPY . .
RUN mkdir -p /srv/churn-platform/storage/onboarding /srv/churn-platform/storage/training-artifacts /srv/churn-platform/services/ml-training
ENV NODE_ENV=production
EXPOSE 8000
CMD ["npm", "start"]
