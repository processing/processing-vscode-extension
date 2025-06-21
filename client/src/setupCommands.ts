import { dirname } from 'path/posix';
import { ExtensionContext, commands, Uri, window, workspace } from 'vscode';
import { state } from './extension';

export function setupCommands(context: ExtensionContext) {
	const runSketch = commands.registerCommand('processing.sketch.run', (resource: Uri) => {
		// TODO: If the command is run from a keyboard shortcut, find the current file
		if (!resource) {
			return;
		}

		// TODO: Save the current file, maybe settting?
		// TODO: Give feedback if the sketch is starting

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

	const openSketch = commands.registerCommand('processing.sketch.open', async (folder) => {
		if (!folder) {
			window.showErrorMessage("No sketch folder provided.");
			return;
		}

		workspace.updateWorkspaceFolders(
			workspace.workspaceFolders ? workspace.workspaceFolders.length : 0,
			null,
			{ uri: Uri.file(folder) }
		);
		await commands.executeCommand('workbench.view.explorer');
		const folderName = folder.split('/').pop();
		const sketchFile = Uri.file(`${folder}/${folderName}.pde`);
		try {
			if (!workspace.fs.stat(sketchFile)) {
				return;
			}

			const doc = await workspace.openTextDocument(sketchFile);
			if (!doc) {
				window.showErrorMessage(`Could not open sketch file: ${sketchFile.fsPath}`);
				return;
			}
			await window.showTextDocument(doc, { preview: false });
			window.activeTextEditor?.revealRange(doc.lineAt(0).range);
		} catch (error) {
			window.showErrorMessage(`Could not open sketch file: ${sketchFile.fsPath}`);
			console.error(error);
		}
	});

	const newSketch = commands.registerCommand('processing.sketch.new', async () => {
		const folder = await window.showOpenDialog({
			canSelectFiles: false,
			canSelectFolders: true,
			canSelectMany: false,
			title: "Select a folder to create a new sketch in",
			defaultUri: workspace.workspaceFolders ? workspace.workspaceFolders[0].uri : undefined,
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

	context.subscriptions.push(runSketch, stopSketch, openSketch, newSketch);
}
