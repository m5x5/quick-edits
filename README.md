# Quick Edits

Quickly locates the code you need to edit. Optimizes the frontend development workflow.

## Usage

### Popup

Provides a quick way to test TailwindCSS classes and jump to the code you need to edit.

![How to use popup](./docs/how-to-use-popup.gif)

### Extension Settings

Offers a few settings to configure the project code folder that includes the code you want to search through and an editor select box.

![Extension settings popup](./docs/extension-settings-popup.png)

## Installation

### Quick Install 🚀
Follow the [docs](https://quick-edits-extension.vercel.app/docs) to follow the quick install guide.

### Manual Installation

If you're on MacOS simply start the new ./start.sh command and it'll attempt to configure it for you. Otherwise continue with this installation.

#### Chrome Extension

Install and build Chrome Extension.

```bash
  cd browser-extension
  npm install --legacy-peer-deps
  npm run build
```

#### Native Code Search Module

```bash
  cd native-module
  go install
  go build
```

##### MacOS Config

```bash
  cd /Library/Google/Chrome/NativeMessagingHosts
  sudo touch com.my_company.my_application.json
```

Add this as content of `com.my_company.my_application.json`

```json
{
  "name": "com.my_company.my_application",
  "description": "Quick Edits",
  "path": "/absolute/path/to/built/go/module/m",
  "type": "stdio",
  "allowed_origins": ["chrome-extension://yourchromeextensionid/"]
}
```
