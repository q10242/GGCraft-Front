# GGCraft Frontend

Vue 3 前端應用，部署於 Google Cloud Run。

## 🚀 快速開始

### 本地開發

```bash
# 安裝依賴
npm install

# 啟動開發服務器
npm run dev

# 訪問 http://localhost:5173
```

### 使用 Docker 本地運行

```bash
# 構建映像
docker build -t ggcraft-front .

# 運行容器
docker run -p 8080:8080 \
  -e VITE_API_URL=http://localhost:8000/api \
  ggcraft-front
```

## 📦 技術棧

- Vue 3 + TypeScript
- Vite
- Tailwind CSS
- Headless UI
- TanStack Query (Vue Query)
- Pinia (狀態管理)
- Axios
- FormKit
- VueUse
- Day.js

## 🏗️ Cloud Run 部署

### 前置準備

1. **構建並推送基底映像**（首次或依賴更新時）：
   ```bash
   # 在 base-images repo 中
   cd ../base-images
   ./build.sh
   docker push gcr.io/YOUR_PROJECT_ID/ggcraft-vue-base:latest
   ```

2. **更新 API URL**：
   編輯 `cloudbuild.yaml`，設置正確的 `VITE_API_URL`：
   ```yaml
   --set-env-vars
   VITE_API_URL=https://ggcraft-api-xxxxx.a.run.app/api
   ```

### 手動部署

```bash
# 構建映像
gcloud builds submit --config cloudbuild.yaml

# 或使用 Docker 本地構建
docker build --build-arg BASE_IMAGE=gcr.io/YOUR_PROJECT_ID/ggcraft-vue-base:latest \
  -t gcr.io/YOUR_PROJECT_ID/ggcraft-front:latest .

docker push gcr.io/YOUR_PROJECT_ID/ggcraft-front:latest

# 部署到 Cloud Run
gcloud run deploy ggcraft-front \
  --image gcr.io/YOUR_PROJECT_ID/ggcraft-front:latest \
  --region asia-east1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars VITE_API_URL=https://your-api-url.run.app/api
```

### 自動部署（Cloud Build Trigger）

1. 連接 GitHub repository
2. 創建 Cloud Build Trigger：
   - **事件**: Push to branch
   - **分支**: `^main$`
   - **配置**: `cloudbuild.yaml`

每次推送到 `main` 分支時會自動觸發部署。

## 🧪 測試

```bash
# 單元測試
npm run test:unit

# E2E 測試
npm run test:e2e

# E2E 測試（UI 模式）
npm run test:e2e:ui
```

## 🔧 環境變數

### 構建時環境變數

```env
VITE_API_URL=https://your-api-url.run.app/api
```

### 運行時環境變數注入

Dockerfile 中的 `start.sh` 腳本會在容器啟動時注入環境變數到構建好的 JavaScript 文件中，這樣可以在不重新構建的情況下更改 API URL。

## 📁 專案結構

```
GGCraft-Front/
├── src/
│   ├── assets/
│   │   └── main.css
│   ├── components/
│   ├── plugins/
│   │   ├── vue-query.ts
│   │   └── formkit.ts
│   ├── router/
│   ├── services/
│   │   ├── api.ts
│   │   └── auth.ts
│   ├── stores/
│   ├── views/
│   ├── App.vue
│   └── main.ts
├── docker/
│   ├── nginx-cloudrun.conf
│   └── start.sh
├── e2e/
│   └── example.spec.ts
├── cloudbuild.yaml
├── Dockerfile
├── playwright.config.ts
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

## 🎨 開發指南

### 添加新頁面

1. 在 `src/views/` 創建 Vue 組件
2. 在 `src/router/index.ts` 添加路由
3. 使用 Tailwind CSS 進行樣式設計

### API 調用

使用預配置的 axios 實例：

```typescript
import api from '@/services/api'

// GET 請求
const { data } = await api.get('/users')

// POST 請求
const { data } = await api.post('/users', { name: 'John' })
```

### 使用 Vue Query

```vue
<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import api from '@/services/api'

const { data, isLoading, error } = useQuery({
  queryKey: ['users'],
  queryFn: () => api.get('/users').then(res => res.data)
})
</script>
```

### 表單處理

使用 FormKit：

```vue
<template>
  <FormKit type="form" @submit="handleSubmit">
    <FormKit
      type="email"
      name="email"
      label="Email"
      validation="required|email"
    />
    <FormKit
      type="password"
      name="password"
      label="Password"
      validation="required|length:8"
    />
  </FormKit>
</template>
```

## 🐛 故障排除

### 構建失敗

```bash
# 清除緩存
rm -rf node_modules package-lock.json
npm install

# 檢查 TypeScript 錯誤
npm run type-check
```

### 容器無法啟動

```bash
# 查看 Cloud Run 日誌
gcloud run services logs read ggcraft-front --region=asia-east1

# 本地測試
docker run -it ggcraft-front /bin/sh
```

### API 連接失敗

1. 檢查 `VITE_API_URL` 環境變數
2. 確認 CORS 設置正確
3. 檢查 API 服務是否運行

## 📊 性能優化

- ✅ Vite 構建優化
- ✅ Tailwind CSS purge
- ✅ Nginx gzip 壓縮
- ✅ 靜態資源緩存（1年）
- ✅ Code splitting

## 🔗 相關專案

- [GGCraft-API](https://github.com/your-org/GGCraft-API) - Laravel 後端
- [GGCraft-Base-Images](https://github.com/your-org/GGCraft-Base-Images) - 基底映像

## 📄 授權

私有專案
