# Prompt Memo - VSCode Extension

A simple and intuitive memo extension for Visual Studio Code that allows you to quickly jot down ideas and notes while coding.

## Features

- **Quick Memo Creation**: Create new memos instantly with a single click
- **Auto-Save**: All changes are automatically saved to memory
- **Session Persistence**: Your memos are preserved across VSCode sessions
- **Clean UI**: Minimal, distraction-free interface that follows your VSCode theme
- **Keyboard Navigation**: Navigate between memos using Tab/Shift+Tab

## Installation

### From Source

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Compile the extension:
   ```bash
   npm run compile
   ```
4. Press `F5` in VSCode to run the extension in a new Extension Development Host window

## Usage

1. Click on the Prompt Memo icon in the Activity Bar (left sidebar)
2. Click the `+` button to create a new memo
3. Click inside a memo to start typing
4. Click the `×` button on any memo to delete it
5. All changes are automatically saved

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- Visual Studio Code

### Setup

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch

# Run tests
npm test
```

### Project Structure

```
prompt-memo/
├── src/
│   ├── extension.ts          # Extension entry point
│   ├── providers/            # View providers
│   ├── models/               # Data models
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Utility functions
│   └── webview/              # Webview assets (HTML, CSS, JS)
├── resources/                # Icons and other resources
├── out/                      # Compiled JavaScript (generated)
├── package.json              # Extension manifest
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

## Configuration

Currently, Prompt Memo works out of the box with no configuration required. Future versions may include:

- Maximum number of memos
- Maximum memo length
- Auto-save delay customization
- Export/import functionality

## Known Issues

- Memos are stored in memory and workspace state only (no file persistence)
- No search or filtering capabilities yet
- Limited to plain text (no markdown support)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This extension is provided as-is for educational and development purposes.

## Changelog

### Version 1.0.0
- Initial release
- Basic memo creation, editing, and deletion
- Auto-save functionality
- Session persistence
- VSCode theme integration