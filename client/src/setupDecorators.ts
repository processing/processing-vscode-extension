import * as vscode from 'vscode';

class PdeFileDecorationProvider implements vscode.FileDecorationProvider {
	onDidChangeFileDecorations?: vscode.Event<vscode.Uri | vscode.Uri[] | undefined>;

	provideFileDecoration(uri: vscode.Uri): vscode.ProviderResult<vscode.FileDecoration> {
		if (uri.path.endsWith('.pde')) {
			return {
				badge: '$(play)',
				tooltip: 'Processing Sketch',
				propagate: false
			};
		}
		return undefined;
	}
}


export function setupDecorators(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.window.registerFileDecorationProvider(new PdeFileDecorationProvider())
	);
}