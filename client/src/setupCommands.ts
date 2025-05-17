import { dirname } from 'path/posix';
import { ExtensionContext, commands, Uri, window } from 'vscode';
import { state } from './extension';

export function setupCommands(context: ExtensionContext) {
	const runSketch = commands.registerCommand('processing.sketch.run', (resource: Uri) => {
		if (!resource) {
			return;
		}

		let terminal = state.terminal;
		// Create a new terminal
		if (terminal === undefined || terminal.exitStatus) {
			state.terminal = window.createTerminal("Sketch");
			terminal = state.terminal;
		}

		// Show the terminal panel
		terminal.show(true);

		// clear the terminal
		terminal.sendText("clear", true);

		let path = state.selectedVersion.path;
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
		if (state.terminal === undefined) {
			return;
		}

		// Send the command to the terminal
		state.terminal.sendText('\x03', false);
	});

	context.subscriptions.push(runSketch, stopSketch);
}
