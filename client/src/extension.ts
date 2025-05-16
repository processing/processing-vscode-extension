/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { workspace, ExtensionContext } from 'vscode';

import {
	Executable,
	LanguageClient,
	LanguageClientOptions,
	// TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(_: ExtensionContext) {
	// TODO: Find where the Processing app is installed
	// TODO: Add a launch button when a relevant file is open


	const serverOptions: Executable = {
		command: "/Users/steftervelde/Source/Processing-Foundation/processing4/app/build/compose/binaries/main/app/Processing.app/Contents/MacOS/Processing",
		args: ["lsp"],
		options: {
			cwd: "/Users/steftervelde/Source/Processing-Foundation/processing4"
		},
	};

	// Options to control the language client
	const clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'plaintext' }],
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
