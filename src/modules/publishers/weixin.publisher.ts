import { ConfigManager } from "@src/utils/config/config-manager.ts";
import {
  ContentPublisher,
  PublishResult,
} from "@src/modules/interfaces/publisher.interface.ts";
import { Buffer } from "node:buffer";
import { Logger } from "@zilla/logger";
const logger = new Logger("weixin-publisher");

interface WeixinToken {
  access_token: string;
  expires_in: number;
  expiresAt: Date;
}

interface WeixinDraft {
  media_id: string;
  article_id?: string;
}

export class WeixinPublisher implements ContentPublisher {
  private accessToken: WeixinToken | null = null;
  private appId: string | undefined;
  private appSecret: string | undefined;

  constructor() {
  }

  async refresh(): Promise<void> {
    this.appId = await ConfigManager.getInstance().get("WEIXIN_APP_ID");
    this.appSecret = await ConfigManager.getInstance().get("WEIXIN_APP_SECRET");
  }

  private async ensureAccessToken(forceRefresh = false): Promise<string> {
    // 检查现有token是否有效（预留5分钟余量，避免在操作过程中过期）
    if (
      !forceRefresh &&
      this.accessToken &&
      this.accessToken.expiresAt > new Date(Date.now() + 300000)
    ) {
      return this.accessToken.access_token;
    }

    try {
      await this.refresh();
      
      // 使用稳定版本的 token API（推荐）
      const url =
        `https://api.weixin.qq.com/cgi-bin/stable_token`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "client_credential",
          appid: this.appId,
          secret: this.appSecret,
          force_refresh: forceRefresh,
        }),
      }).then((res) => res.json());

      const { access_token, expires_in, errcode, errmsg } = response;

      if (errcode && errcode !== 0) {
        throw new Error(`获取access_token失败: ${errcode} - ${errmsg}`);
      }

      if (!access_token) {
        throw new Error("获取access_token失败: " + JSON.stringify(response));
      }

      logger.info(`微信 access_token 获取成功，有效期: ${expires_in}秒`);

      this.accessToken = {
        access_token,
        expires_in,
        expiresAt: new Date(Date.now() + expires_in * 1000),
      };

      return access_token;
    } catch (error) {
      logger.error("获取微信access_token失败:", error);
      throw error;
    }
  }

  /**
   * 强制刷新 access_token
   */
  async forceRefreshToken(): Promise<void> {
    this.accessToken = null;
    await this.ensureAccessToken(true);
  }

  private async uploadDraft(
    article: string,
    title: string,
    digest: string,
    mediaId: string,
    retryOnTokenError = true,
  ): Promise<WeixinDraft> {
    const token = await this.ensureAccessToken();
    const url =
      `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${token}`;

    const articles = [
      {
        title: title,
        author: await ConfigManager.getInstance().get("AUTHOR"),
        digest: digest,
        content: article,
        thumb_media_id: mediaId,
        need_open_comment:
          await ConfigManager.getInstance().get("NEED_OPEN_COMMENT") ===
              "true"
            ? 1
            : 0,
        only_fans_can_comment:
          await ConfigManager.getInstance().get("ONLY_FANS_CAN_COMMENT") ===
              "true"
            ? 1
            : 0,
      },
    ];
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articles,
        }),
      }).then((res) => res.json());

      if (response.errcode) {
        // 如果是 token 失效错误，强制刷新后重试一次
        if (
          retryOnTokenError &&
          (response.errcode === 40001 || response.errcode === 42001 ||
            response.errmsg?.includes("access_token"))
        ) {
          logger.warn("access_token 失效，强制刷新后重试...");
          await this.forceRefreshToken();
          return this.uploadDraft(article, title, digest, mediaId, false);
        }
        throw new Error(`上传草稿失败: ${response.errmsg}`);
      }

      return {
        media_id: response.media_id,
      };
    } catch (error) {
      logger.error("上传微信草稿失败:", error);
      throw error;
    }
  }
  /**
   * 上传图片到微信
   * @param imageUrl 图片URL 或 base64 data URL
   * @returns 图片ID (media_id)
   */
  async uploadImage(imageUrl: string): Promise<string> {
    if (!imageUrl) {
      // 如果图片URL为空，则返回一个默认的图片ID
      return "SwCSRjrdGJNaWioRQUHzgF68BHFkSlb_f5xlTquvsOSA6Yy0ZRjFo0aW9eS3JJu_";
    }

    let imageBuffer: ArrayBuffer;

    // 处理 base64 data URL
    if (imageUrl.startsWith("data:image/")) {
      logger.info("检测到 base64 图片，正在转换...");
      const match = imageUrl.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      if (!match) {
        throw new Error("无效的 base64 图片格式");
      }
      const base64Data = match[2];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      imageBuffer = bytes.buffer;
      logger.info(`base64 图片大小: ${(bytes.length / 1024).toFixed(2)}KB`);
    } else {
      // 普通 URL，下载图片
      imageBuffer = await fetch(imageUrl).then((res) => res.arrayBuffer());
    }

    const token = await this.ensureAccessToken();
    const url =
      `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=image`;

    try {
      // 创建FormData并添加图片数据
      const formData = new FormData();
      formData.append(
        "media",
        new Blob([imageBuffer], { type: "image/jpeg" }),
        `image_${Math.random().toString(36).substring(2, 8)}.jpg`,
      );

      const response = await fetch(url, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "*/*",
        },
      }).then((res) => res.json());

      if (response.errcode) {
        throw new Error(`上传图片失败: ${response.errmsg}`);
      }

      return response.media_id;
    } catch (error) {
      logger.error("上传微信图片失败:", error);
      throw error;
    }
  }

  /**
   * 上传图文消息内的图片获取URL
   * @param imageUrl 图片URL
   * @returns 图片URL
   * @description 本接口所上传的图片不占用公众号的素材库中图片数量的限制
   * 图片仅支持jpg/png格式，大小必须在1MB以下
   */
  async uploadContentImage(
    imageUrl: string,
    imageBuffer?: Buffer,
  ): Promise<string> {
    if (!imageUrl) {
      throw new Error("图片URL不能为空");
    }

    const token = await this.ensureAccessToken();
    const url =
      `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${token}`;

    try {
      // 创建FormData并添加图片数据
      const formData = new FormData();

      if (imageBuffer) {
        // 验证图片格式（检查文件头）
        const isJPEG = imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8;
        const isPNG = imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50 && 
                      imageBuffer[2] === 0x4E && imageBuffer[3] === 0x47;
        
        if (!isJPEG && !isPNG) {
          const hex = Array.from(imageBuffer.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(' ');
          const hint = (hex.startsWith('3c 3f') || hex.startsWith('3c 21')) ? '（可能为 HTML/XML 错误页，请检查图片 URL 是否有效）' : '';
          throw new Error(`无效的图片格式，文件头: ${hex}${hint}`);
        }
        
        // 根据格式设置正确的 MIME 类型和文件扩展名
        const mimeType = isJPEG ? "image/jpeg" : "image/png";
        const extension = isJPEG ? "jpg" : "png";
        
        formData.append(
          "media",
          new Blob([imageBuffer], { type: mimeType }),
          `image_${Math.random().toString(36).substring(2, 8)}.${extension}`,
        );
      } else {
        // 否则下载原图
        const buffer = await fetch(imageUrl).then((res) => res.arrayBuffer());
        const bufferArray = new Uint8Array(buffer);
        
        // 验证图片格式
        const isJPEG = bufferArray[0] === 0xFF && bufferArray[1] === 0xD8;
        const isPNG = bufferArray[0] === 0x89 && bufferArray[1] === 0x50 && 
                      bufferArray[2] === 0x4E && bufferArray[3] === 0x47;
        
        if (!isJPEG && !isPNG) {
          const hex = Array.from(bufferArray.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(' ');
          const hint = (hex.startsWith('3c 3f') || hex.startsWith('3c 21')) ? '（可能为 HTML/XML 错误页，请检查图片 URL 是否有效）' : '';
          throw new Error(`无效的图片格式，文件头: ${hex}${hint}`);
        }
        
        const mimeType = isJPEG ? "image/jpeg" : "image/png";
        const extension = isJPEG ? "jpg" : "png";
        
        formData.append(
          "media",
          new Blob([bufferArray], { type: mimeType }),
          `image_${Math.random().toString(36).substring(2, 8)}.${extension}`,
        );
      }

      const response = await fetch(url, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "*/*",
        },
      }).then((res) => res.json());

      if (response.errcode) {
        throw new Error(`上传图文消息图片失败: ${response.errmsg}`);
      }

      return response.url;
    } catch (error) {
      logger.error("上传微信图文消息图片失败:", error);
      throw error;
    }
  }

  /**
   * 发布文章到微信
   * @param article 文章内容
   * @param title 文章标题
   * @param digest 文章摘要
   * @param mediaId 图片ID
   * @returns 发布结果
   */
  async publish(
    article: string,
    title: string,
    digest: string,
    mediaId: string,
  ): Promise<PublishResult> {
    try {
      // 上传草稿
      const draft = await this.uploadDraft(article, title, digest, mediaId);
      return {
        publishId: draft.media_id,
        status: "draft",
        publishedAt: new Date(),
        platform: "weixin",
        url: `https://mp.weixin.qq.com/s/${draft.media_id}`,
      };
    } catch (error) {
      logger.error("微信发布失败:", error);
      throw error;
    }
  }

  /**
   * 验证当前服务器IP是否在微信公众号的IP白名单中
   * @returns 返回验证结果，true表示IP在白名单中，false表示不在
   * @throws 当API调用失败时抛出错误（非IP白名单相关的错误）
   */
  async validateIpWhitelist(): Promise<string | boolean> {
    try {
      await this.ensureAccessToken();
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes("40164")) {
        return error.message.match(/invalid ip ([^ ]+)/)?.[1] ?? "未知IP";
      }
      throw error;
    }
  }
}
