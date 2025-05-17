import { workspace } from 'vscode';
import { LanguageClientOptions } from 'vscode-languageclient';
import { Executable, LanguageClient } from 'vscode-languageclient/node';
import { state } from './extension';

export function setupLanguageServer() {
	const serverOptions: Executable = {
		command: state.selectedVersion.path,
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
	state.client = new LanguageClient(
		'languageServerExample',
		'Processing Language Server',
		serverOptions,
		clientOptions
	);

	state.client.error = function (e) {
		console.log(e);
	};




	// Start the client. This will also launch the server
	state.client.start();
}
