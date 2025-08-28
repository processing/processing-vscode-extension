import { RelativePattern, window, workspace, WorkspaceFolder } from 'vscode';

export function setupPDEFiles() {
	workspace.onDidChangeWorkspaceFolders(event => {
		event.added.forEach(OpenSketchFiles);
	});


	workspace.workspaceFolders?.forEach(OpenSketchFiles);
}

async function OpenSketchFiles(folder: WorkspaceFolder) {
	// find all the .pde files in the folder
	const files = await workspace.findFiles(new RelativePattern(folder, '*.{pde,java}'));

	for (const file of files) {
		const doc = await workspace.openTextDocument(file);
		if (!doc) {
			window.showErrorMessage(`Could not open sketch file: ${file.fsPath}`);
			return;
		}
		await window.showTextDocument(doc, { preview: false });
	}
}