export interface PerformSearchData {
  folder: string;
  classes: string;
  textContent: string;
  browserUrl: string;
}

interface OpenEditorData {
  path: string;
  lineNumber: number;
  charNumber: number;
  editor: 'vscode' | 'phpstorm' | 'zed';
}

export type ActionType = "perform_search" | "open_editor";

export type ActionData<T extends ActionType> = T extends "perform_search"
  ? PerformSearchData
  : T extends "open_editor"
  ? OpenEditorData
  : never;

export type NativeResponse<T extends ActionType> = {
  success: boolean;
  message: string;
} & T extends "perform_search"
  ? { data: { path: string; lineNumber: number; charNumber: number }[] }
  : T extends "open_editor"
  ? object
  : never;

export default class NativeMessageController {
  port: chrome.runtime.Port = chrome.runtime.connectNative(
    "com.quick_edits.native_search"
  );
  promises: Map<string, (msg: NativeResponse<ActionType>) => void> = new Map();

  constructor() {
    this.port.onMessage.addListener((msg) => {
      this.promises.get(msg.id)?.(msg);
      // this.promises.values().next().value?.(msg);
      // get active tab id
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0].id;

        if (tabId === undefined) return;
        try {
          chrome.tabs.sendMessage(tabId || 0, {
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
      console.log("Disconnected");
    });
  }

  generateMessageId() {
    return Math.random().toString(36).substring(7);
  }

  exec<T extends ActionType>(action: T, data: ActionData<T>) {
    const id = this.generateMessageId();
    this.port.postMessage({ id, action, data });

    return new Promise<NativeResponse<T>>((resolve, reject) => {
      this.promises.set(id, (msg) => {
        this.promises.delete(id);
        resolve(msg as NativeResponse<T>);
      });
    });
  }
}
