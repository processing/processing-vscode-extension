
import { ExtensionContext, Terminal } from 'vscode';

import {
	LanguageClient
} from 'vscode-languageclient/node';
import { setupSelectedVersion } from './setupSelectedVersion';
import { setupCommands } from './setupCommands';
import { setupLanguageServer } from './setupLanguageServer';
import { setupSidebar } from './setupSidebar';
import { setupDecorators } from './setupDecorators';
import { setupPDEFiles } from './setupPDEFiles';


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
	// TODO: Detect other Processing extensions and warn the user

	// TODO: Cache the selected version between sessions
	await setupSelectedVersion(context);
	setupCommands(context);
	setupLanguageServer();
	setupSidebar();
	setupDecorators(context);
	setupPDEFiles();
}


export function deactivate(): Thenable<void> | undefined {
	if (!state.client) {
		return undefined;
	}
	return state.client.stop();
}


