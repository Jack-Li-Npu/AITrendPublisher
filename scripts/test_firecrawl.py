import requests
import time
import json
import os

def test_firecrawl():
    # 1. 尝试从 .env 文件读取 API Key
    api_key = None
    if os.path.exists('.env'):
        with open('.env', 'r') as f:
            for line in f:
                if line.startswith('FIRE_CRAWL_API_KEY='):
                    api_key = line.split('=')[1].strip().strip('"').strip("'")
                    break
    
    if not api_key:
        print("❌ 错误: 未在 .env 中找到 FIRE_CRAWL_API_KEY")
        # 也可以手动在这里填入进行测试
        # api_key = "fc-..." 
        return

    print(f"🌐 正在测试 Firecrawl API (使用 Key: {api_key[:8]}...)")
    
    url = "https://api.firecrawl.dev/v2/scrape"
    target_url = "https://example.com"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "url": target_url,
        "formats": ["markdown"],
        "onlyMainContent": True
    }

    start_time = time.time()
    
    try:
        # 发起请求，设置 30 秒超时
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        duration = (time.time() - start_time) * 1000
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 测试成功! (耗时: {duration:.2f}ms)")
            print("--------------------------------------------------")
            content = data.get('data', {}).get('markdown', '') or data.get('markdown', '')
            print(f"内容预览: {content[:200]}...")
            print("--------------------------------------------------")
        else:
            print(f"❌ API 请求失败! (状态码: {response.status_code})")
            print(f"返回信息: {response.text}")
            
    except requests.exceptions.ProxyError:
        print("❌ 代理错误: 请检查你的 VPN/代理设置")
    except requests.exceptions.Timeout:
        print("❌ 连接超时: 网络链路较慢，建议开启代理")
    except requests.exceptions.ConnectionError as e:
        print(f"❌ 网络连接失败: {e}")
    except Exception as e:
        print(f"❌ 发生未知错误: {e}")

if __name__ == "__main__":
    # 如果没有安装 requests，请运行: pip install requests
    try:
        test_firecrawl()
    except ImportError:
        print("💡 请先安装 requests 库: pip install requests")
