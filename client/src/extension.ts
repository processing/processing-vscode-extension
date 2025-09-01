
import { ExtensionContext, Terminal } from 'vscode';

import { LanguageClient } from 'vscode-languageclient/node';
import { setupSelectedVersion } from './setupSelectedVersion';
import { setupCommands } from './setupCommands';
import { setupLanguageServer } from './setupLanguageServer';
import { setupSidebar } from './setupSidebar';
import { setupDecorators } from './setupDecorators';
import { setupPDEFiles } from './setupPDEFiles';
import { EventEmitter } from 'stream';
import setupConsole from './setupConsole';


export interface ProcessingVersion {
	version: string;
	path: string;
}

export const state = {
	terminal: undefined as Terminal | undefined,
	client: undefined as LanguageClient | undefined,
	selectedVersion: undefined as ProcessingVersion | undefined,
	onDidVersionChange: new EventEmitter<null>()
};

export async function activate(context: ExtensionContext) {
	// TODO: Detect other Processing extensions and warn the user
	// TODO: Add a open contribution manager action (Needs Processing integration)
	// TODO: Add checks for if a required Processing version is met (e.g, this specific feature works with 4.4.6+)
	// TODO: Sketch management (open folder as sketch, create new sketch, etc)
	// TODO: Exporting to standalone application
	// TODO: Override the default save-as
	// TODO: limit running sketches when a sketch is open
	// TODO: Sketch explorer context menu (right click)

	// Set up the selected Processing version, awaiting because we don't want to continue until we have a version
	await setupSelectedVersion(context);
	setupCommands(context);
	setupLanguageServer();
	setupSidebar(context);
	setupConsole(context);
	setupDecorators(context);
	setupPDEFiles();
}


export function deactivate(): Thenable<void> | undefined {
	if (!state.client) {
		return undefined;
	}
	return state.client.stop();
}


