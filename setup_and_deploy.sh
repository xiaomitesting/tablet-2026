#!/bin/bash
# ============================================
# MIMI 飛書 Bitable 同步 - 一鍵部署
# ============================================
# 用法: bash setup_and_deploy.sh
# 
# 前置條件:
#   1. 已安裝 Node.js (https://nodejs.org)
#   2. 有 Cloudflare 帳號 (免費)
#
# 這個腳本會:
#   1. 安裝 wrangler CLI
#   2. 登錄 Cloudflare（瀏覽器自動打開）
#   3. 設置飛書 App Secret
#   4. 部署 Worker
#   5. 輸出 Worker URL
# ============================================
set -e

echo ""
echo "🦞 MIMI 飛書同步 - 一鍵部署"
echo "================================"
echo ""

# --- Step 1: 檢查 Node.js ---
if ! command -v node &> /dev/null; then
    echo "❌ 需要安裝 Node.js"
    echo "   下載: https://nodejs.org"
    exit 1
fi
echo "✅ Node.js $(node -v)"

# --- Step 2: 安裝 wrangler ---
echo "📦 安裝 wrangler..."
npm install -g wrangler 2>&1 | tail -1
echo "✅ wrangler $(wrangler --version 2>/dev/null || echo '已安裝')"

# --- Step 3: 登錄 Cloudflare ---
echo ""
echo "🔐 接下來會打開瀏覽器，請登錄你的 Cloudflare 帳號"
echo "   如果沒有帳號，先去 https://dash.cloudflare.com/sign-up 免費註冊"
echo ""
read -p "按 Enter 繼續..."
npx wrangler login

# --- Step 4: 設置飛書 App Secret ---
echo ""
echo "🔑 請輸入你的飛書 App Secret"
echo "   (在飛書開放平台 → 應用 → 憑證與基本信息)"
read -p "App Secret: " APP_SECRET

if [ -z "$APP_SECRET" ]; then
    echo "❌ App Secret 不能為空"
    exit 1
fi

echo "   設置 FEISHU_APP_ID..."
echo "cli_aad8c63cb6389cc9" | npx wrangler secret put FEISHU_APP_ID 2>&1 | tail -1

echo "   設置 FEISHU_APP_SECRET..."
echo "$APP_SECRET" | npx wrangler secret put FEISHU_APP_SECRET 2>&1 | tail -1

# --- Step 5: 部署 ---
echo ""
echo "📤 部署 Worker..."
cd "$(dirname "$0")/worker"
RESULT=$(npx wrangler deploy 2>&1)
echo "$RESULT"

# --- Step 6: 獲取 URL ---
echo ""
echo "================================"
echo "✅ 部署完成！"
echo ""

# 從 deploy 輸出中提取 URL
WORKER_URL=$(echo "$RESULT" | grep -oE 'https://[a-zA-Z0-9._-]+\.workers\.dev' | head -1)

if [ -n "$WORKER_URL" ]; then
    echo "📌 你的 Worker URL:"
    echo "   $WORKER_URL"
    echo ""
    echo "🔧 在所有門店網站的控制台（F12）執行一次:"
    echo "   setSyncUrl('$WORKER_URL')"
    echo ""
    echo "或者在 index.html 中找到 SYNC_WORKER_URL 變量，"
    echo "把它設為你的 Worker URL，這樣每個門店部署都會自動同步。"
else
    echo "⚠️  部署成功，但需要手動查看 URL"
    echo "   登錄 https://dash.cloudflare.com → Workers → mimi-sync"
    echo "   複製你的 Worker URL（格式: https://xxx.workers.dev）"
fi

echo ""
echo "🎉 之後每個門店的問答數據都會自動同步到飛書 Bitable！"
echo ""
