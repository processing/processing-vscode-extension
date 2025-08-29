# Processing VSCode Extension

<!-- TODO: Generate grammar based on the installed Processing version -->

Create and run Processing sketches in Visual Studio Code.

![Processing VS Code Extension Screenshot](.github/media/screenshot.png)

This extension adds support for Processing sketches in VSCode. Includes familiar run and stop buttons, syntax highlighting, code suggestions, and easy access to your sketchbook and examples. If you prefer coding in VS Code, this extension makes it easier to work with Processing.

## Requirements

You will need **Processing 4.4.6 or later** installed on your computer.

Download Processing here: [Processing](https://processing.org).

**IMPORTANT:** Run Processing at least once after installing it. This creates the files the extension needs.

## Features

* Run and stop sketches directly in VS Code
* Browse your sketchbook and open example sketches
* Syntax highlighting for Processing code
* Code suggestions and error checking with the Processing Language Server
* Automatic detection of your Processing installation (no manual configuration required)

## Install

Install the extension from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/) or search for "Processing" in the [Extension Marketplace](https://code.visualstudio.com/docs/configure/extensions/extension-marketplace) within VS Code.

## Getting Started

1. Install the Processing extension for VS Code.
2. Click the Processing icon in the Activity Bar on the side of the VS Code window.
3. Open a sketch from your sketchbook or from the examples.
4. Click the Run button to start your sketch.

When you run a sketch, a terminal will open at the bottom of VS Code to show the build output, and the Processing sketch window will appear.

## Settings

You can customize the extension in VS Code settings

1. Open Settings via `Ctrl + ,` on Windows/Linux or `Cmd + ,` on macOS.
2. Search for "Processing" to find all available settings.
3. Modify the settings as needed:
   - `processing.autosave`: Automatically saves your sketch before running it. Default: `true`.
   - `processing.newWindow`: Opens sketches in a new VS Code window. If disabled, sketches open in the current window. Default: `true`.
   - `processing.version`: Choose which installed Processing version to use. Default is `latest`, but you can specify a version (e.g., `4.4.6`).

## Troubleshooting

If something doesn’t work:

* Close VSCode
* Check you have installed Processing 4.4.6 or later and ran it once
* Run the Processing editor once
* Restart VSCode
* Remove any other Processing extensions that might conflict with this one
* Close any running Processing sketches or editor windows

## Compatibility

The extension has been tested on:

* macOS (Apple Silicon)
* Windows 64-bit
* Linux 64-bit

## Known Issues

* Some Processing constants (like `PI`, `RGB`, `DEGREES`) are not highlighted yet
* Classes from third-party libraries are not recognized by the language server (sketches still run fine). See [this issue](https://github.com/processing/processing-vscode-extension/issues/9)
* The Run/Stop buttons do not visually indicate when a sketch is running (this is due to limitations in VS Code's extension API)
* The extension includes a bundled JDK for macOS, Windows, and Linux. This increases the extension size, but is necessary for reliably detecting your Processing installation across platforms. Eventually, we hope to remove this dependency and rely on the Processing CLI instead.

## Contributing

This project is still growing, and contributions are welcome!

**IMPORTANT:** Before submitting a pull request, please read the [CONTRIBUTING.md](https://github.com/processing/processing4/blob/main/CONTRIBUTING.md) from the Processing repository.

Please note we also have a [Code of Conduct](https://github.com/processing/processing4/blob/main/CODE-OF-CONDUCT.md) that we expect all contributors to follow.

## License

This project uses the GPL-2.0 License. See [LICENSE](LICENSE.md) for details.

For Processing’s own licensing, see the Processing [README](https://github.com/processing/processing4?tab=readme-ov-file).