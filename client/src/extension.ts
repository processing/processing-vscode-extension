import { exec, execSync } from 'child_process';
import { dirname, join } from 'path';
import { workspace, ExtensionContext, Uri, FileType, window, commands, Terminal } from 'vscode';

import {
	Executable,
	LanguageClient,
	LanguageClientOptions
} from 'vscode-languageclient/node';

let client: LanguageClient;

interface ProcessingVersion {
	version: string;
	path: string;
}

let terminal: Terminal | undefined;

export async function activate(context: ExtensionContext) {
	// TODO: Check for other Processing plugins and request deactivation if they are installed

	const config = workspace.getConfiguration('processing');

	let binaryPath = context.asAbsolutePath(join(`install-locator-${process.platform}`, 'bin', 'install-locator'));
	const javaPath = context.asAbsolutePath(join(`install-locator-${process.platform}`, 'bin', 'java'));

	await new Promise<void>((resolve, reject) => {
		// add executable permissions to the binary
		if (process.platform !== "win32") {
			exec(`chmod +x ${binaryPath}`, (error, stdout, stderr) => {
				if (error) {
					reject(error);
				}
				if (stderr) {
					reject(stderr);
				}
				resolve();
			});

			// add executable permissions to the java binary
			exec(`chmod +x ${javaPath}`, (error, stdout, stderr) => {
				if (error) {
					reject(error);
				}
				if (stderr) {
					reject(stderr);
				}
				resolve();
			});
		} else {
			// on windows we need to add the .bat to the binary path
			binaryPath = `${binaryPath}.bat`;
			resolve();
		}
	}).catch((e) => {
		console.error(`Error setting permissions for ${binaryPath}: ${e}`);
		window.showErrorMessage(`Error setting permissions for ${binaryPath}: ${e}`);
	});

	const versions = await new Promise<ProcessingVersion[]>((resolve, reject) => {
		exec(binaryPath, (error, stdout, stderr) => {
			if (error) {
				reject(error);
			}
			if (stderr) {
				reject(stderr);
			}
			const jsArray = stdout
				// remove the square brackets
				.replace("[", "")
				.replace("]", "")
				// split into array items
				.split(',')
				.map(s => s.trim().split("^"))
				.map(v => ({ path: v[0], version: v[1] }))
				// order by semver
				.sort((a, b) => compareVersions(a.version, b.version))
				.reverse()
				;

			;
			resolve(jsArray);
		});
	}).catch((e) => {
		console.error(`Error getting Processing versions: ${e}`);
		window.showErrorMessage(`Error getting Processing versions: ${e}`);
	});
	if (!versions || versions.length === 0) {
		await window.showErrorMessage(
			`Processing not found, please install Processing 4.4.5 or higher and open it at least once.`,
		);
		return;
	}
	console.log(`Found Processing versions: ${versions.map(v => `${v.version} ${v.path}`).join(", ")}`);

	const desiredVersion = config.get("version");

	let selectedVersion: ProcessingVersion | undefined = undefined;
	for (const app of versions) {
		if (desiredVersion !== "latest" && app.version !== desiredVersion) {
			console.warn(`Version (${app.version}) does not match the desired version (${desiredVersion}).`);
			continue;
		}
		// Check if the path is a executable file
		try {
			const stat = await workspace.fs.stat(Uri.file(join(app.path)));
			if (stat.type !== FileType.File) {
				console.warn(`Path (${app.path}) is not a file.`);
				continue;
			}
			const version = execSync(`"${app.path}" --version`, { encoding: 'utf-8' });
			if (!version || !version.includes(app.version)) {
				console.warn(`Version (${app.version}) at ${app.path} does not match the expected version.`);
				continue;
			}

			selectedVersion = app;
		} catch (e) {
			console.warn(`Checking version (${app.version}) at ${app.path} failed. ${e}`);
			continue;
		}

	}

	if (!selectedVersion) {
		await window.showErrorMessage(
			`Desired Processing version not found, please install Processing ${desiredVersion} and open it at least once. Found versions: ${versions.map(v => v.version).join(", ")}`,
		);
		return;
	}

	const serverOptions: Executable = {
		command: selectedVersion.path,
		args: ["lsp"]
	};

	// Options to control the language client
	const clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'Processing' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'languageServerExample',
		'Processing Language Server',
		serverOptions,
		clientOptions
	);

	client.error = function (e) {
		console.log(e);
	};


	const runSketch = commands.registerCommand('processing.sketch.run', (resource: Uri) => {
		if (!resource) {
			return;
		}

		// Create a new terminal
		if (terminal === undefined) {
			terminal = window.createTerminal("Sketch");
		}

		// Show the terminal panel
		terminal.show(true);

		// clear the terminal
		terminal.sendText("clear", true);

		let path = selectedVersion.path;
		if (process.platform === "win32") {
			// on windows we need to escape spaces
			path = `& "${path}"`;
		}

		// Send the command to the terminal
		terminal.sendText(
			`${path} cli --sketch="${dirname(
				resource.fsPath
			)}" --run`,
			true
		);
	});

	const stopSketch = commands.registerCommand('processing.sketch.stop', () => {
		if (terminal === undefined) {
			return;
		}

		// Send the command to the terminal
		terminal.sendText('\x03', false);
	});

	context.subscriptions.push(runSketch, stopSketch);

	// Start the client. This will also launch the server
	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}

function compareVersions(a: string | undefined, b: string | undefined): number {
	const parseVersion = (v: string | undefined) => {
		if (!v || v === 'unspecified') { return []; }
		return v.split('.').map(n => parseInt(n, 10) || 0);
	};

	const aVersion = parseVersion(a);
	const bVersion = parseVersion(b);
	const maxLength = Math.max(aVersion.length, bVersion.length);

	for (let i = 0; i < maxLength; i++) {
		const diff = (aVersion[i] || 0) - (bVersion[i] || 0);
		if (diff !== 0) { return diff; }
	}

	return 0;
}
