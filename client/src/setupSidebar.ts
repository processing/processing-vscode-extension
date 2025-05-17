import { join } from 'path';
import { ProviderResult, TreeDataProvider, TreeItem, TreeItemCollapsibleState, window } from 'vscode';



export function setupSidebar() {
	const treeDataProvider = new ProcessingWindowDataProvider();
	window.createTreeView('processingSidebarView', { treeDataProvider });

	{
		const treeDataProvider = new ProcessingWindowDataProvider();
		window.createTreeView('processingSidebarView2', { treeDataProvider });
	}

}

class ProcessingTreeItem extends TreeItem {
	constructor(
		public readonly label: string,
		private version: string,
		public readonly collapsibleState: TreeItemCollapsibleState,
		public readonly path = "",
	) {
		super(label, collapsibleState);
		this.tooltip = `${this.label}-${this.version}`;
		this.iconPath = join(__dirname, "..", "..", "media/processing.svg");
	}


}

// TODO: Top level items: [examples, sketchbook]
// TODO: Add examples from libraries
// TODO: Connect to Processing and request where the sketchbook is located

class ProcessingWindowDataProvider implements TreeDataProvider<ProcessingTreeItem> {
	getTreeItem(element: ProcessingTreeItem): TreeItem | Thenable<TreeItem> {
		return element;
	}
	getChildren(element?: ProcessingTreeItem): ProviderResult<ProcessingTreeItem[]> {
		if (element === undefined) {
			// return the examples and sketchbook items
			return [
				new ProcessingTreeItem('Sketchbook', '3.5.4', TreeItemCollapsibleState.Collapsed),
				new ProcessingTreeItem('Examples', '3.5.4', TreeItemCollapsibleState.Expanded),
			];
		} else {
			// Return the 
			return [
				new ProcessingTreeItem('Example 1', '3.5.4', TreeItemCollapsibleState.None),
			];
		}
	}
}