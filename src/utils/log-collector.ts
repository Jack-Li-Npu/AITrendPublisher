/**
 * 日志收集器 - 用于拦截全局日志并提供给 UI 的 SSE 接口
 */
export class LogCollector {
  private static instance: LogCollector;
  private buffer: string[] = [];
  private maxLines = 1000;
  private listeners: Set<(log: string) => void> = new Set();
  private originalStdoutWrite: typeof Deno.stdout.write | null = null;
  private isProcessingConsole = false; // 防止 console -> stdout 的重复捕获
  private recentLogs: Set<string> = new Set(); // 用于去重

  private constructor() {
    // 拦截全局 console.log/info/error，以便捕获非 zilla/logger 的输出
    const originalLog = console.log;
    const originalInfo = console.info;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args: any[]) => {
      const msg = this.formatArgs(args);
      this.pushLog(msg);
      this.isProcessingConsole = true;
      originalLog(...args);
      this.isProcessingConsole = false;
    };
    console.info = (...args: any[]) => {
      const msg = `[INFO] ${this.formatArgs(args)}`;
      this.pushLog(msg);
      this.isProcessingConsole = true;
      originalInfo(...args);
      this.isProcessingConsole = false;
    };
    console.error = (...args: any[]) => {
      const msg = `[ERROR] ${this.formatArgs(args)}`;
      this.pushLog(msg);
      this.isProcessingConsole = true;
      originalError(...args);
      this.isProcessingConsole = false;
    };
    console.warn = (...args: any[]) => {
      const msg = `[WARN] ${this.formatArgs(args)}`;
      this.pushLog(msg);
      this.isProcessingConsole = true;
      originalWarn(...args);
      this.isProcessingConsole = false;
    };

    // 同时拦截 Deno.stdout.write（@zilla/logger 可能直接使用它）
    this.interceptStdout();
  }

  /**
   * 拦截 Deno.stdout.write 以捕获直接写入 stdout 的日志
   */
  private interceptStdout() {
    const self = this;
    const originalWrite = Deno.stdout.write.bind(Deno.stdout);
    this.originalStdoutWrite = originalWrite;
    const decoder = new TextDecoder();
    let pendingLine = "";

    // @ts-ignore - 覆盖 stdout.write
    Deno.stdout.write = async function(data: Uint8Array): Promise<number> {
      // 如果正在处理 console.log 等方法的输出，跳过以避免重复
      if (!self.isProcessingConsole) {
        const text = decoder.decode(data, { stream: true });

        // 处理可能的多行输出
        const lines = (pendingLine + text).split("\n");
        pendingLine = lines.pop() || ""; // 最后一部分可能是不完整的行

        for (const line of lines) {
          if (line.trim()) {
            // 移除 ANSI 颜色代码以便在前端显示
            const cleanLine = self.stripAnsi(line);
            if (cleanLine.trim()) {
              self.pushLog(cleanLine);
            }
          }
        }
      }

      return originalWrite(data);
    };
  }

  /**
   * 格式化参数为字符串
   */
  private formatArgs(args: any[]): string {
    return args.map(arg => {
      if (typeof arg === "object") {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(" ");
  }

  /**
   * 移除 ANSI 颜色代码
   */
  private stripAnsi(str: string): string {
    // eslint-disable-next-line no-control-regex
    return str.replace(/\x1b\[[0-9;]*m/g, "");
  }

  public static getInstance(): LogCollector {
    if (!LogCollector.instance) {
      LogCollector.instance = new LogCollector();
    }
    return LogCollector.instance;
  }

  private pushLog(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    const formatted = `[${timestamp}] ${message}`;

    this.buffer.push(formatted);
    if (this.buffer.length > this.maxLines) {
      this.buffer.shift();
    }

    // 通知所有正在监听 SSE 的客户端
    this.listeners.forEach((callback) => callback(formatted));
  }

  public addListener(callback: (log: string) => void) {
    this.listeners.add(callback);
    // 立即发送历史记录
    this.buffer.forEach((log) => callback(log));
  }

  public removeListener(callback: (log: string) => void) {
    this.listeners.delete(callback);
  }

  public getHistory(): string[] {
    return [...this.buffer];
  }
}
