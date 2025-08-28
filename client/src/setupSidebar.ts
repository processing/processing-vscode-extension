import { exec, spawn } from 'child_process';
import { join } from 'path';
import { Event, EventEmitter, ProviderResult, TreeDataProvider, TreeItem, TreeItemCollapsibleState, window } from 'vscode';
import { state } from './extension';
import { existsSync } from 'fs';


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
	// TODO: Show welcome screens whilst we are starting Processing
	// TODO: Open examples as read-only or in a temporary location
	// TODO: Reload examples and sketchbook when Processing version changes
	// TODO: Add cache to results to speed up loading

	setupExamples();
	setupSketchbook();
}

async function setupExamples() {
	const examplesProvider = new ProcessingWindowDataProvider('contributions examples list');
	window.createTreeView('processingSidebarExamplesView', { treeDataProvider: examplesProvider });
}

async function setupSketchbook() {
	const sketchbookProvider = new ProcessingWindowDataProvider('sketchbook list');
	window.createTreeView('processingSidebarSketchbookView', { treeDataProvider: sketchbookProvider });
}


class ProcessingWindowDataProvider implements TreeDataProvider<FolderTreeItem | SketchTreeItem> {
	constructor(
		public readonly command: string
	) {
		this._folders = [];
		this.populate();
	}
	private _folders: Folder[];

	private _onDidChangeTreeData: EventEmitter<any> = new EventEmitter<any>();
	readonly onDidChangeTreeData: Event<any> = this._onDidChangeTreeData.event;

	async populate() {
		this._folders = await this.grabSketchesWithCommand(this.command);
		this._onDidChangeTreeData.fire(null);
	}


	getTreeItem(element: FolderTreeItem): TreeItem | Thenable<TreeItem> {
		return element;
	}
	getChildren(element?: FolderTreeItem): ProviderResult<(FolderTreeItem | SketchTreeItem)[]> {
		if (element === undefined) {
			return this._folders.map((folder) => new FolderTreeItem(folder)) ?? [];
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

	grabSketchesWithCommand(command: string): Promise<Folder[]> {
		return new Promise<Folder[]>((resolve) => {
			const process = spawn(state.selectedVersion.path, command.split(' '));
			let data = '';
			process.stdout.on('data', (chunk) => {
				data += chunk;
			});
			process.on('close', (code) => {
				if (code !== 0) {
					console.error(`Process exited with code ${code}`);
					resolve([]);
					return;
				}
				try {
					const folders = JSON.parse(data) as Folder[];
					resolve(folders);
				} catch (e) {
					console.error(`Error parsing JSON: ${e}`);
					resolve([]);
				}
			});
		});
	}
}

class FolderTreeItem extends TreeItem {
	constructor(
		public readonly folder: Folder
	) {
		const label = folder.name;
		super(label, TreeItemCollapsibleState.Collapsed);
		this.tooltip = `${this.label}`;
	}
}

class SketchTreeItem extends TreeItem {
	constructor(
		public readonly sketch: Sketch
	) {
		const label = sketch.name;
		super(label, TreeItemCollapsibleState.None);
		this.tooltip = `${this.label}`;
		this.iconPath = join(__dirname, "..", "..", "media/processing-flat-color.svg");
		this.command = {
			command: 'processing.sketch.open',
			title: 'Open Sketch',
			arguments: [this.sketch.path]
		};

		// TODO: Make showing a preview a toggleable setting
		const preview = `${sketch.path}/${sketch.name}.png`;
		if (existsSync(preview)) {
			this.iconPath = preview;
		}
	}
}


