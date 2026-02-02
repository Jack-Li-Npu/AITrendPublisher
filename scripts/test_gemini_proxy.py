#!/usr/bin/env python3
"""
Gemini API 代理测试脚本 (Python 版本)

用途：测试通过自定义代理访问 Gemini API

使用方法：
    python scripts/test_gemini_proxy.py
"""

import json
import time
import urllib.request
import urllib.error

# 配置
GOOGLE_GEMINI_BASE_URL = "https://api.jacklihome.com"
GEMINI_API_KEY = "sk-fa13627c5052be8524e6cb4a1ffea0ca3890ccfda7a6e89adb7c8d26358f7ebc"
GEMINI_MODEL = "gemini-2.0-flash"

print("=" * 60)
print("🧪 Gemini API 代理测试 (Python)")
print("=" * 60)
print()

print("📋 配置信息：")
print(f"   Base URL: {GOOGLE_GEMINI_BASE_URL}")
print(f"   Model: {GEMINI_MODEL}")
print(f"   API Key: {GEMINI_API_KEY[:20]}...")
print()

# 构建请求 URL（Gemini 原生协议）
endpoint = f"{GOOGLE_GEMINI_BASE_URL}/v1beta/models/{GEMINI_MODEL}:generateContent"

print(f"🔗 请求地址: {endpoint}")
print()

# 构建请求体（Gemini 原生格式）
request_body = {
    "contents": [
        {
            "parts": [
                {
                    "text": "你好！请用一句话介绍 AI 技术的发展趋势。"
                }
            ]
        }
    ],
    "generationConfig": {
        "temperature": 0.7,
        "maxOutputTokens": 200
    }
}

print("📤 发送请求...")
print()

try:
    start_time = time.time()
    
    # 创建请求
    req = urllib.request.Request(
        endpoint,
        data=json.dumps(request_body).encode('utf-8'),
        headers={
            'Content-Type': 'application/json',
            'x-goog-api-key': GEMINI_API_KEY,  # Gemini 原生协议
        },
        method='POST'
    )
    
    # 发送请求
    with urllib.request.urlopen(req) as response:
        elapsed = (time.time() - start_time) * 1000
        
        print(f"⏱️  响应时间: {elapsed:.0f}ms")
        print(f"📊 HTTP 状态: {response.status} {response.reason}")
        print()
        
        data = json.loads(response.read().decode('utf-8'))
        
        print("✅ 请求成功！")
        print()
        print("=" * 60)
        print("📝 响应内容：")
        print("=" * 60)
        print()
        
        # 提取并打印 Gemini 响应内容
        if 'candidates' in data and len(data['candidates']) > 0:
            first_candidate = data['candidates'][0]
            if 'content' in first_candidate and 'parts' in first_candidate['content']:
                text = ''.join(part.get('text', '') for part in first_candidate['content']['parts'])
                print(text)
            else:
                print("⚠️  响应格式不包含文本内容")
                print(json.dumps(data, indent=2, ensure_ascii=False))
        else:
            print("⚠️  没有找到候选响应")
            print(json.dumps(data, indent=2, ensure_ascii=False))
        
        print()
        print("=" * 60)
        print("🎉 测试完成！代理配置正常工作")
        print("=" * 60)

except urllib.error.HTTPError as e:
    elapsed = (time.time() - start_time) * 1000
    
    print(f"⏱️  响应时间: {elapsed:.0f}ms")
    print(f"📊 HTTP 状态: {e.code} {e.reason}")
    print()
    print("❌ 请求失败！")
    print("错误详情：")
    
    error_body = e.read().decode('utf-8')
    try:
        error_json = json.loads(error_body)
        print(json.dumps(error_json, indent=2, ensure_ascii=False))
        
        # 针对常见错误给出提示
        if e.code == 503:
            print()
            print("💡 提示：503 错误通常表示：")
            print("   - 代理服务暂时不可用")
            print("   - 账户配额已用完")
            print("   - 上游 Gemini 服务维护中")
        elif e.code == 401 or e.code == 403:
            print()
            print("💡 提示：认证失败，请检查 API Key 是否正确")
        elif e.code == 404:
            print()
            print("💡 提示：端点不存在，请检查 Base URL 和模型名称")
    except json.JSONDecodeError:
        print(error_body)
    
    exit(1)

except Exception as e:
    print()
    print("❌ 测试失败！")
    print(f"错误信息：{str(e)}")
    
    if "URLError" in str(type(e)):
        print()
        print("💡 提示：可能是网络连接问题或代理地址不正确")
    
    exit(1)
