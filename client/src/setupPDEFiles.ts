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
	let mainFile = files.find(file => file.fsPath.endsWith(`${folder.name}.pde`));
	// read the properties file if it exists
	// and check if main has been declared
	const [propertiesFile] = await workspace.findFiles(new RelativePattern(folder, 'sketch.properties'));
	if (propertiesFile) {
		const propertiesDoc = await workspace.openTextDocument(propertiesFile);
		const propertiesText = propertiesDoc.getText();
		const mainMatch = propertiesText.match(/main\s*=\s*(\S+)/);
		if (mainMatch) {
			const mainFileName = mainMatch[1];
			mainFile = files.find(file => file.fsPath.endsWith(mainFileName));
		}
	}
	if (mainFile) {
		// move the declared main file to the front
		files.splice(files.indexOf(mainFile), 1);
		files.unshift(mainFile);
	}

	for (const file of files) {
		const doc = await workspace.openTextDocument(file);
		if (!doc) {
			window.showErrorMessage(`Could not open sketch file: ${file.fsPath}`);
			return;
		}
		await window.showTextDocument(doc, { preview: false, preserveFocus: true });
	}
	if (mainFile) { await window.showTextDocument(mainFile, { preview: false }); }

}