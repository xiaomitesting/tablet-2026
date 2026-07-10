#!/bin/bash
# 竞品价格自动更新脚本
# 每天运行一次，爬取友商香港官网价格，更新竞品JSON文件

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT="$SCRIPT_DIR/../js/data/competitors.json"
LOG="/tmp/competitor-price-update.log"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始竞品价格更新..." >> "$LOG"

# 读取当前数据
CURRENT_DATA=$(cat "$OUTPUT" 2>/dev/null || echo '{}')

# 用 Python 脚本抓取价格
python3 << 'PYEOF'
import json
import re
import sys
from urllib.request import Request, urlopen
from urllib.error import URLError
from datetime import datetime

OUTPUT = "PLACEHOLDER_OUTPUT"

def fetch_price(url, patterns, timeout=15):
    """尝试从URL抓取价格"""
    try:
        req = Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'Accept-Language': 'zh-HK,zh;q=0.9,en;q=0.8',
            'Accept': 'text/html,application/xhtml+xml'
        })
        resp = urlopen(req, timeout=timeout)
        html = resp.read().decode('utf-8', errors='ignore')
        for pattern in patterns:
            match = re.search(pattern, html)
            if match:
                price_str = match.group(1).replace(',', '').replace(' ', '')
                return int(price_str)
    except Exception as e:
        print(f"  [WARN] 抓取失败 {url}: {e}", file=sys.stderr)
    return None

# 竞品价格源配置
SOURCES = [
    {
        "id": "ipad_11_a16",
        "url": "https://www.apple.com/hk/shop/buy-ipad/ipad",
        "patterns": [
            r'HK\$[\s]*([0-9,]+)[\s]*(?:起|From)',
            r'from\s+HK\$([0-9,]+)',
            r'"price"[:\s]*"?HK?\$?([0-9,]+)"?'
        ],
        "fallback": 3499
    },
    {
        "id": "ipad_air_m3",
        "url": "https://www.apple.com/hk/shop/buy-ipad/ipad-air",
        "patterns": [
            r'HK\$[\s]*([0-9,]+)[\s]*(?:起|From)',
            r'from\s+HK\$([0-9,]+)',
            r'"price"[:\s]*"?HK?\$?([0-9,]+)"?'
        ],
        "fallback": 4599
    },
    {
        "id": "samsung_tab_s10_fe",
        "url": "https://www.samsung.com/hk/tablets/galaxy-tab-s10-fe/galaxy-tab-s10-fe-gray-128gb-sm-x520nzaatgy/",
        "patterns": [
            r'HK\$([0-9,]+)',
            r'"price"[:\s]*"?([0-9,]+)"?',
            r'price["\s:]+(\$|HKD)?\s*([0-9,]+)'
        ],
        "fallback": 2699
    },
    {
        "id": "huawei_matepad_11_5s",
        "url": "https://consumer.huawei.com/hk/tablets/matepad-11-5-s/",
        "patterns": [
            r'HK\$\s*([0-9,]+)',
            r'"price"[:\s]*"?([0-9,]+)"?',
            r'HKD\s*([0-9,]+)'
        ],
        "fallback": 3188
    }
]

print("🔍 开始抓取竞品价格...")

updated_prices = {}
now = datetime.now().isoformat()

for source in SOURCES:
    print(f"  📡 {source['id']}...", end=" ")
    price = fetch_price(source['url'], source['patterns'])
    if price:
        updated_prices[source['id']] = {"price": price, "updated": now, "source": "live"}
        print(f"✅ HK${price}")
    else:
        updated_prices[source['id']] = {"price": source['fallback'], "updated": now, "source": "fallback"}
        print(f"⚠️ 使用默认值 HK${source['fallback']}")

# 读取现有竞品数据并更新价格
try:
    with open(OUTPUT, 'r') as f:
        competitors = json.load(f)
except:
    competitors = []

price_map = updated_prices
changes = []

for comp in competitors:
    pid = comp.get('id', '')
    if pid in price_map:
        old_price = comp.get('price', 0)
        new_price = price_map[pid]['price']
        if old_price != new_price:
            changes.append(f"  {comp['name']}: HK${old_price} → HK${new_price}")
        comp['price'] = new_price
        comp['lastUpdated'] = price_map[pid]['updated']
        comp['priceSource'] = price_map[pid]['source']

# 写回文件
with open(OUTPUT, 'w', encoding='utf-8') as f:
    json.dump(competitors, f, ensure_ascii=False, indent=2)

print(f"\n📊 更新完成！共 {len(competitors)} 款竞品")
if changes:
    print("💰 价格变动：")
    for c in changes:
        print(c)
else:
    print("✅ 价格无变动")

# 输出变更摘要供 git commit 使用
summary = f"竞品价格更新 ({datetime.now().strftime('%Y-%m-%d')}): " + \
    (", ".join([f"{c.split(':')[0]}" for c in changes]) if changes else "无变动")
with open("/tmp/competitor-update-summary.txt", "w") as f:
    f.write(summary)

PYEOF

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 更新完成" >> "$LOG"
