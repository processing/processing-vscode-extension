# Processing VSCode Extension

<!-- TODO: Generate grammar based on the installed Processing version -->

Create and run Processing sketches in Visual Studio Code.

![Processing VS Code Extension Screenshot](.github/media/screenshot.png)

This extension adds support for Processing sketches in VSCode. It includes familiar run and stop buttons, syntax highlighting, code suggestions, and easy access to your sketchbook and examples.

## Getting Started

### Prerequisites

Before you begin, make sure to:

- Install **Processing 4.4.6 or later** ([Download Processing](https://processing.org))
- Run Processing at least once after installing it. This creates the files the extension needs.
- Uninstall any previously installed Processing extensions. This extension may conflict with other Processing extensions, leading to unexpected behavior.

### Installation

Install the extension from the [Visual Studio Marketplace](https://vscode.processing.org/) or search for "Processing" in the [Extension Marketplace](https://marketplace.visualstudio.com/). You can also install it directly from VS Code by searching for "Processing" in the Extensions view (`Ctrl + Shift + X` or `Cmd + Shift + X` on macOS). Pick the extension published by "Processing Foundation".

### Running Your First Sketch

1. Click the Processing icon in the Activity Bar on the side of the VS Code window.
2. Open a sketch from your sketchbook or from the examples.
3. Click the Run button to start your sketch.

When you run a sketch, a terminal will open at the bottom of VS Code to show the build output, and the Processing sketch window will appear.

## Settings

You can customize the extension in VS Code settings

1. Open Settings via `Ctrl + ,` on Windows/Linux or `Cmd + ,` on macOS.
2. Search for "Processing" to find all available settings.
3. Modify the settings as needed:
   - `processing.autosave`: Automatically saves your sketch before running it. Default: `true`.
   - `processing.newWindow`: Opens sketches in a new VS Code window. If disabled, sketches open in the current window. Default: `true`.
   - `processing.version`: Choose which installed Processing version to use. Default is `latest`, but you can specify a version (e.g., `4.4.6`).

## Known Issues

* Some Processing constants (like `PI`, `RGB`, `DEGREES`) are not highlighted yet
* Classes from third-party libraries are not recognized by the language server (sketches still run fine). See [this issue](https://github.com/processing/processing-vscode-extension/issues/9)
* The extension includes a bundled JDK for macOS, Windows, and Linux. This increases the extension size, but is necessary for reliably detecting your Processing installation across platforms. Eventually, we hope to remove this dependency and rely on the Processing CLI instead.

## Troubleshooting

If something doesn’t work:

* Close VSCode
* Remove any other Processing extensions you may have installed
* Install the latest version of Processing (4.4.6 or later)
* Close any running Processing sketches or editor windows
* Run the Processing editor (PDE) once

After following these steps, reopen VSCode and try again. 

If you still encounter issues, please ask on the [Processing Forum](https://discourse.processing.org) or check the [GitHub Issues page](https://github.com/processing/processing-vscode-extension/issues).

## Compatibility

The extension has been tested on:

* macOS (Apple Silicon)
* Windows 64-bit
* Linux 64-bit

## Contributing

This project is still growing, and contributions are welcome!

**IMPORTANT:** Before submitting a pull request, please read the [CONTRIBUTING.md](https://github.com/processing/processing4/blob/main/CONTRIBUTING.md) from the Processing repository.

Please note we also have a [Code of Conduct](https://github.com/processing/processing4/blob/main/CODE-OF-CONDUCT.md) that we expect all contributors to follow.

## License

This project uses the GPL-2.0 License. See [LICENSE](LICENSE.md) for details.

For Processing’s own licensing, see the Processing [README](https://github.com/processing/processing4?tab=readme-ov-file).