import { basename, join } from 'path';
import { ExtensionContext, commands, Uri, window, workspace } from 'vscode';

export function setupCommands(context: ExtensionContext) {
	const openSketch = commands.registerCommand('processing.sketch.open', async (folder: string, isReadOnly: boolean) => {
		if (!folder) {
			window.showErrorMessage("No sketch folder provided.");
			return;
		}
		if (isReadOnly) {
			const path = join(context.globalStorageUri.fsPath, `processing-sketch-${new Date().getTime()}`, basename(folder));
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
		const lastSketchNumberReset = context.globalState.get<number>('lastSketchNumberReset', 0);
		const now = Date.now();
		// Reset the sketch number if it has been more than 24 hours since the last reset
		if (now - lastSketchNumberReset > 24 * 60 * 60 * 1000) {
			context.globalState.update('sketchNumber', 0);
			context.globalState.update('lastSketchNumberReset', now);
		}
		
		const sketchNumber = context.globalState.get<number>('sketchNumber', 0);
		
		const sketchName = await window.showInputBox({
			prompt: "Enter the name of the new sketch",
			placeHolder: "Sketch name",
			value: `sketch_${new Date().toISOString().slice(2, 10).replace(/-/g, '')}${numberToAlpha(sketchNumber)}`,
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
		const sketchPath = Uri.joinPath(folder[0], sketchName);
		try {
			await workspace.fs.createDirectory(sketchPath);
			const sketchFile = Uri.joinPath(sketchPath, `${sketchName}.pde`);
			await workspace.fs.writeFile(sketchFile, new Uint8Array());
			await commands.executeCommand('processing.sketch.open', sketchPath.fsPath);
			window.showInformationMessage(`New sketch created: ${sketchName}`);

			context.globalState.update('sketchNumber', sketchNumber + 1);
		} catch (error) {
			window.showErrorMessage(`Could not create sketch: ${error instanceof Error ? error.message : error}`);
			console.error(error);
		}
		
	});

	// TODO: Add command to select Processing version and set the setting

	context.subscriptions.push(openSketch, newSketch);
}

// Helper function to convert a number to alphabetical (e.g., 0 = a, 1 = b, ..., 25 = z, 26 = aa, etc.)
function numberToAlpha(n: number): string {
	let s = '';
	n++;
	while (n > 0) {
		n--; // Adjust for 0-indexing
		s = String.fromCharCode(97 + (n % 26)) + s;
		n = Math.floor(n / 26);
	}
	return s;
}