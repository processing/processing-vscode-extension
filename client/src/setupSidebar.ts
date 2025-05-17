import { CancellationToken, Event, ProviderResult, TreeDataProvider, TreeItem, window } from 'vscode';



export function setupSidebar() {
	const treeDataProvider = new ProcessingWindowDataProvider();
	window.createTreeView('processingSidebarView', { treeDataProvider });

}

class ProcessingTreeItem extends TreeItem {
	constructor() {
		super('Processing Item');
	}

	getTreeItem() {
		return this;
	}

	getChildren() {
		return [];
	}
}

// TODO: Top level items: [examples, sketchbook]
// TODO: Add examples from libraries
// TODO: Connect to Processing and request where the sketchbook is located

class ProcessingWindowDataProvider implements TreeDataProvider<ProcessingTreeItem> {
	onDidChangeTreeData?: Event<void | ProcessingTreeItem | ProcessingTreeItem[]>;
	getTreeItem(element: ProcessingTreeItem): TreeItem | Thenable<TreeItem> {
		throw new Error('getTreeItem not implemented.');
	}
	getChildren(element?: ProcessingTreeItem): ProviderResult<ProcessingTreeItem[]> {
		throw new Error('getChildren not implemented.');
	}
	getParent?(element: ProcessingTreeItem): ProviderResult<ProcessingTreeItem> {
		throw new Error('getParent not implemented.');
	}
	resolveTreeItem?(item: TreeItem, element: ProcessingTreeItem, token: CancellationToken): ProviderResult<TreeItem> {
		throw new Error('resolveTreeItem not implemented.');
	}

}