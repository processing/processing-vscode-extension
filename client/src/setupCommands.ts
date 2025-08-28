import { dirname, join } from 'path';
import { ExtensionContext, commands, Uri, window, workspace } from 'vscode';
import { state } from './extension';

export function setupCommands(context: ExtensionContext) {
	const runSketch = commands.registerCommand('processing.sketch.run', (resource: Uri) => {
		// TODO: Use VScode contexts to highlight run button when sketch is running, blocked until we do not run the sketch in a terminal
		// https://code.visualstudio.com/api/references/when-clause-contexts

		const autosave = workspace
			.getConfiguration('processing')
			.get<boolean>('autosave');
		if (autosave === true) {
			// Save all files before running the sketch
			commands.executeCommand('workbench.action.files.saveAll');
		}
		if (resource == undefined) {
			const editor = window.activeTextEditor;
			if (editor) {
				resource = editor.document.uri;
			}
		}

		if (!resource) {
			return;
		}

		// TODO: Give feedback if the sketch is starting

		let terminal = state.terminal;
		// Create a new terminal
		if (terminal === undefined || terminal.exitStatus) {
			window.terminals.forEach(t => {
				if (t.name === "Sketch") {
					t.dispose();
				}
			});
			state.terminal = window.createTerminal("Sketch");
			terminal = state.terminal;
			// Show the terminal panel the first time
			terminal.show(true);
		} else {
			// Send the command to the terminal
			terminal.sendText('\x03', false);
		}

		// clear the terminal
		terminal.sendText("clear", true);

		let path = state.selectedVersion.path;
		if (process.platform === "win32") {
			// on windows we need to escape spaces
			path = `& "${path}"`;
		}

		// Send the command to the terminal
		terminal.sendText(
			`${path} cli --sketch="${dirname(resource.fsPath)}" --run`,
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

	const openSketch = commands.registerCommand('processing.sketch.open', async (folder: string, isReadOnly: boolean) => {
		if (!folder) {
			window.showErrorMessage("No sketch folder provided.");
			return;
		}
		if (isReadOnly) {
			const path = join(context.globalStorageUri.fsPath, `processing-sketch-${new Date().getTime()}`, dirname(folder));
			try {
				await workspace.fs.copy(Uri.file(folder), Uri.file(path), { overwrite: true });
				folder = path;
			} catch (error) {
				window.showErrorMessage(`Could not open read-only sketch: ${error instanceof Error ? error.message : error}`);
				console.error(error);
				return;
			}
		}

		const newWindow = workspace
			.getConfiguration('processing')
			.get<boolean>('newWindow');
		
		if (newWindow === true) {
			await commands.executeCommand('vscode.openFolder', Uri.file(folder), true);
		} else {
			workspace.updateWorkspaceFolders(
				workspace.workspaceFolders ? workspace.workspaceFolders.length : 0,
				null,
				{ uri: Uri.file(folder) }
			);
		}
	});

	const newSketch = commands.registerCommand('processing.sketch.new', async () => {
		const folder = await window.showOpenDialog({
			canSelectFiles: false,
			canSelectFolders: true,
			canSelectMany: false,
			title: "Select a folder to create a new sketch in",
			defaultUri: workspace.workspaceFolders && workspace.workspaceFolders[0]
				? Uri.joinPath(workspace.workspaceFolders[0].uri, '..')
				: undefined,
		});
		if (!folder || folder.length === 0) {
			return;
		}
		// TODO: increment a,b,c if a sketch with the same name already exists
		const sketchName = await window.showInputBox({
			prompt: "Enter the name of the new sketch",
			placeHolder: "Sketch name",
			value: `sketch_${new Date().toISOString().slice(2, 10).replace(/-/g, '')}a`,
			validateInput: (value) => {
				if (!value || value.trim() === "") {
					return "Sketch name cannot be empty.";
				}
				return null;
			}
		});
		if (!sketchName) {
			window.showErrorMessage("No sketch name provided.");
			return;
		}
		const sketchPath = Uri.joinPath(folder[0], sketchName);
		try {
			await workspace.fs.createDirectory(sketchPath);
			const sketchFile = Uri.joinPath(sketchPath, `${sketchName}.pde`);
			await workspace.fs.writeFile(sketchFile, new Uint8Array());
			await commands.executeCommand('processing.sketch.open', sketchPath.fsPath);
			window.showInformationMessage(`New sketch created: ${sketchName}`);
		} catch (error) {
			window.showErrorMessage(`Could not create sketch: ${error instanceof Error ? error.message : error}`);
			console.error(error);
		}
	});

	// TODO: Add command to select Processing version and set the setting

	context.subscriptions.push(runSketch, stopSketch, openSketch, newSketch);
}
