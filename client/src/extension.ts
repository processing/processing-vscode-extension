
import { ExtensionContext, Terminal } from 'vscode';

import {
	LanguageClient
} from 'vscode-languageclient/node';
import { setupSelectedVersion } from './setupSelectedVersion';
import { setupCommands } from './setupCommands';
import { setupLanguageServer } from './setupLanguageServer';


export interface ProcessingVersion {
	version: string;
	path: string;
}

export const state = {
	terminal: undefined as Terminal | undefined,
	client: undefined as LanguageClient | undefined,
	selectedVersion: undefined as ProcessingVersion | undefined,
};

export async function activate(context: ExtensionContext) {
	// TODO: Check for other Processing plugins and request deactivation if they are installed
	// TODO: Add examples and sketchbook window
	// TODO: Generate grammar based on the Processing version

	await setupSelectedVersion(context);
	setupCommands(context);
	setupLanguageServer();
}


export function deactivate(): Thenable<void> | undefined {
	if (!state.client) {
		return undefined;
	}
	return state.client.stop();
}


