/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { exec, execSync } from 'child_process';
import { join } from 'path';
import { workspace, ExtensionContext, Uri, FileType, window } from 'vscode';

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

export async function activate(context: ExtensionContext) {
	// TODO: Find where the Processing app is installed
	// TODO: Add a launch button when a relevant file is open
	const config = workspace.getConfiguration('processing');


	const binaryPath = context.asAbsolutePath(join('install-locator', "build", 'image', 'bin', 'install-locator'));

	const versions = await new Promise<ProcessingVersion[]>((resolve, reject) => {
		exec(binaryPath, (error, stdout, stderr) => {
			if (error) {
				console.error(`exec error: ${error}`);
				reject(error);
			}
			if (stderr) {
				console.error(`stderr: ${stderr}`);
				reject(stderr);
			}
			const jsArray = stdout
				// remove the square brackets
				.slice(1, -2)
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
	});

	const desiredVersion = config.get("version");


	let selectedVersion: ProcessingVersion | undefined = undefined;
	for (const app of versions) {
		if (desiredVersion !== "latest" && app.version !== desiredVersion) {
			continue;
		}
		// Check if the path is a executable file
		try {
			const stat = await workspace.fs.stat(Uri.file(join(app.path)));
			if (stat.type !== FileType.File) {
				continue;
			}
			const version = execSync(`"${app.path}" --version`, { encoding: 'utf-8' });
			if (!version || !version.includes(app.version)) {
				continue;
			}

			selectedVersion = app;
		} catch {
			continue;
		}

	}

	if (!selectedVersion) {
		await window.showErrorMessage(
			`Processing not found, please install Processing 4.4.5 or higher and run open it at least once.`,
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
