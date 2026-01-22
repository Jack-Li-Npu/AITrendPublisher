// First, define the interface
export interface INotifier {
  refresh(): Promise<void>;
  notify(title: string, content: string, options?: {
    level?: "active" | "timeSensitive" | "passive";
    sound?: string;
    icon?: string;
    group?: string;
    url?: string;
    isArchive?: boolean;
  }): Promise<boolean>;
  success(title: string, content: string): Promise<boolean>;
  error(title: string, content: string): Promise<boolean>;
  warning(title: string, content: string): Promise<boolean>;
  info(title: string, content: string): Promise<boolean>;
}

export type Level = "active" | "timeSensitive" | "passive";
