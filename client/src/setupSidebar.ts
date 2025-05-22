import { exec } from 'child_process';
import { join } from 'path';
import { ProviderResult, TreeDataProvider, TreeItem, TreeItemCollapsibleState, window } from 'vscode';
import { state } from './extension';


export interface Sketch {
	type?: "sketch";
	name: string;
	path: string;
	mode?: string;
}

export interface Folder {
	type?: "folder";
	name: string;
	path: string;
	mode?: string;
	children?: Folder[];
	sketches?: Sketch[];
}



export async function setupSidebar() {
	const examples = await new Promise<Folder[]>((resolve) => {
		exec(`${state.selectedVersion.path} contributions examples list`, (error, stdout, stderr) => {
			if (error) {
				console.error(`exec error: ${error}`);
				return;
			}
			console.log(`stdout: ${stdout}`);
			resolve(JSON.parse(stdout));
		});
	});

	const examplesProvider = new ProcessingWindowDataProvider(examples);
	window.createTreeView('processingSidebarExamplesView', { treeDataProvider: examplesProvider });

	const sketchbook = await new Promise<Folder[]>((resolve) => {
		exec(`${state.selectedVersion.path} sketchbook list`, (error, stdout, stderr) => {
			if (error) {
				console.error(`exec error: ${error}`);
				return;
			}
			console.log(`stdout: ${stdout}`);
			resolve(JSON.parse(stdout));
		});
	});
	const sketchbookProvider = new ProcessingWindowDataProvider(sketchbook);
	window.createTreeView('processingSidebarSketchbookView', { treeDataProvider: sketchbookProvider });

}

class FolderTreeItem extends TreeItem {
	constructor(
		public readonly folder: Folder
	) {
		const label = folder.name;
		super(label, TreeItemCollapsibleState.Collapsed);
		this.tooltip = `${this.label}`;
		this.iconPath = join(__dirname, "..", "..", "media/processing.svg");
	}
}

class SketchTreeItem extends TreeItem {
	constructor(
		public readonly sketch: Sketch
	) {
		const label = sketch.name;
		super(label, TreeItemCollapsibleState.None);
		this.tooltip = `${this.label}`;
		this.iconPath = join(__dirname, "..", "..", "media/processing.svg");
	}
}

// TODO: Top level items: [examples, sketchbook]
// TODO: Add examples from libraries
// TODO: Connect to Processing and request where the sketchbook is located

class ProcessingWindowDataProvider implements TreeDataProvider<FolderTreeItem> {
	constructor(
		public readonly folders: Folder[],
	) {
	}

	getTreeItem(element: FolderTreeItem): TreeItem | Thenable<TreeItem> {
		return element;
	}
	getChildren(element?: FolderTreeItem): ProviderResult<(FolderTreeItem | SketchTreeItem)[]> {
		if (element === undefined) {
			return this.folders.map((folder) => {
				return new FolderTreeItem(folder);
			});
		} else {
			const sketches = element.folder.sketches?.map((sketch) => {
				return new SketchTreeItem(sketch);
			}) ?? [];
			const folders = element.folder.children?.map((folder) => {
				return new FolderTreeItem(folder);
			}) ?? [];

			// Sort sketches and folders
			sketches.sort((a, b) => a.sketch.name.localeCompare(b.sketch.name));
			folders.sort((a, b) => a.folder.name.localeCompare(b.folder.name));

			return [...sketches, ...folders];
		}
	}
}