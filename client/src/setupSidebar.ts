import { spawn } from 'child_process';
import { join } from 'path';
import { Event, EventEmitter, ExtensionContext, ProviderResult, TreeDataProvider, TreeItem, TreeItemCollapsibleState, window } from 'vscode';
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

export async function setupSidebar(context: ExtensionContext) {
	// TODO: Show welcome screens whilst we are starting Processing

	setupSketchTreeView('sketchbook list', 'processingSidebarSketchbookView', context);
	setupSketchTreeView('contributions examples list', 'processingSidebarExamplesView', context, true);
}

function setupSketchTreeView(command: string, viewId: string, context: ExtensionContext, readonly = false) {
	const provider = new ProcessingWindowDataProvider(command, context, readonly);
	window.createTreeView(viewId, { treeDataProvider: provider });
}


class ProcessingWindowDataProvider implements TreeDataProvider<FolderTreeItem | SketchTreeItem> {
	constructor(
		public readonly command: string,
		public readonly context: ExtensionContext,
		public readonly readonly = false
	) {
		this.cached();
		this.populate();
		this.listen();
	}
	private _folders: Folder[] = [];

	private _onDidChangeTreeData: EventEmitter<null> = new EventEmitter<null>();
	readonly onDidChangeTreeData: Event<null> = this._onDidChangeTreeData.event;

	async listen() {
		state.onDidVersionChange.on(null, async () => {
			this.populate();
		});
	}

	async cached() {
		const data = await this.context.globalState.get<string>(`processing-tree-view-${this.command}-cache`);
		if (data) {
			try {
				this._folders = JSON.parse(data) as Folder[];
			} catch (e) {
				console.error(`Error parsing cached JSON: ${e}`);
			}
		}
		this._onDidChangeTreeData.fire(null);
	}

	async populate() {
		this._folders = await this.grabSketches();
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
				return new SketchTreeItem(sketch, this.readonly);
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

	grabSketches(): Promise<Folder[]> {
		return new Promise<Folder[]>((resolve) => {
			const process = spawn(state.selectedVersion.path, this.command.split(' '));
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
					this.context.globalState.update(`processing-tree-view-${this.command}-cache`, data);
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
		public readonly sketch: Sketch,
		public readonly readonly = false
	) {
		const label = sketch.name;
		super(label, TreeItemCollapsibleState.None);
		this.tooltip = `${this.label}`;
		this.iconPath = join(__dirname, "..", "..", "media/processing-flat-color.svg");
		this.command = {
			command: 'processing.sketch.open',
			title: 'Open Sketch',
			arguments: [this.sketch.path, this.readonly]
		};
		// TODO: add right-click menu to open in new window, open containing folder, etc.

		// TODO: Make showing a preview a toggleable setting
		const preview = `${sketch.path}/${sketch.name}.png`;
		if (existsSync(preview)) {
			this.iconPath = preview;
		}
	}
}


