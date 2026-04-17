export interface PerformSearchData {
  folder: string;
  classes: string;
  textContent: string;
  browserUrl: string;
  excludedDirectories?: string[];
}

interface OpenEditorData {
  path: string;
  lineNumber: number;
  charNumber: number;
  editor: "vscode" | "phpstorm" | "zed" | "cursor";
  editorPath?: string;
}

export interface SaveChangesData {
  path: string;
  lineNumber: number;
  charNumber: number;
  originalContent: string;
  newContent: string;
}

export type ActionType = "perform_search" | "open_editor" | "save_changes";

export type ActionData<T extends ActionType> = T extends "perform_search"
  ? PerformSearchData
  : T extends "open_editor"
  ? OpenEditorData
  : T extends "save_changes"
  ? SaveChangesData
  : never;

export type NativeResponse<T extends ActionType> = {
  success: boolean;
  message: string;
  data?: T extends "perform_search"
    ? {
        path: string;
        lineNumber: number;
        charNumber: number;
        isDirectMatch: boolean;
      }[]
    : T extends "open_editor"
    ? object
    : T extends "save_changes"
    ? object
    : never;
};

export default class NativeMessageController {
  port: chrome.runtime.Port | null = null;
  promises: Map<string, (msg: NativeResponse<ActionType>) => void> = new Map();
  private connectionError: Error | null = null;

  constructor() {
    this.initializePort();
  }

  private initializePort() {
    try {
      this.port = chrome.runtime.connectNative("com.quick_edits.native_search");
      this.setupPortListeners();
    } catch (error) {
      this.handleConnectionError(error);
    }
  }

  private handleConnectionError(error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    this.connectionError = new Error(errorMessage);
    console.error(
      "QuickEdits Extension: Failed to connect to native messaging host:",
      error
    );

    // Let the background script handle the error message
    chrome.runtime.sendMessage({
      type: "native_host_error",
      message:
        "Access to the native messaging host is forbidden. Please check your native messaging host configuration.",
    });
  }

  private setupPortListeners() {
    if (!this.port) return;

    this.port.onMessage.addListener((msg) => {
      this.promises.get(msg.id)?.(msg);
      // get active tab id
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id;
        if (tabId === undefined) return;
        try {
          chrome.tabs.sendMessage(tabId, {
            data: msg.data,
            message: msg.message,
            success: msg.success,
          });
        } catch (e) {
          console.error(e);
        }
      });
    });

    this.port.onDisconnect.addListener(() => {
      console.debug("QuickEdits Extension: Disconnected");
      this.handleConnectionError(
        new Error("Native messaging host disconnected")
      );
    });
  }

  generateMessageId() {
    return Math.random().toString(36).substring(7);
  }

  exec<T extends ActionType>(action: T, data: ActionData<T>) {
    if (this.connectionError) {
      return Promise.resolve({
        success: false,
        message: this.connectionError.message,
      } as NativeResponse<T>);
    }

    if (!this.port) {
      return Promise.resolve({
        success: false,
        message: "Native messaging host is not connected",
      } as NativeResponse<T>);
    }

    const id = this.generateMessageId();
    this.port.postMessage({ id, action, data });

    return new Promise<NativeResponse<T>>((resolve, _) => {
      this.promises.set(id, (msg) => {
        this.promises.delete(id);
        resolve(msg as NativeResponse<T>);
      });
    });
  }
}
