import { ChildProcess, spawn } from 'child_process';
import {  commands, ExtensionContext, Uri, ViewColumn, WebviewView, WebviewViewProvider, WebviewViewResolveContext, window, workspace } from 'vscode';
import { state } from './extension';
import { dirname } from 'path';
import treeKill = require('tree-kill');

export default function setupConsole(context: ExtensionContext) {
	// Convert to array to allow for waiting on the process to end
	let sketchProcess: ChildProcess | undefined = undefined;

	const provider = new ProcessingConsoleViewProvider();

	const register = window.registerWebviewViewProvider('processingConsoleView', provider);

	const startSketch = commands.registerCommand('processing.sketch.run', (resource: Uri) => {
		const autosave = workspace
			.getConfiguration('processing')
			.get<boolean>('autosave');
		if (autosave === true) {
			// Save all files before running the sketch
			commands.executeCommand('workbench.action.files.saveAll');
		}
		if (resource == undefined) {
			const editor = window.activeTextEditor;
			if (editor) {
				resource = editor.document.uri;
			}
		}
		
		if (!resource) {
			return;
		}
		commands.executeCommand('processingConsoleView.focus');
		commands.executeCommand('processing.sketch.stop');
		
		const proc = spawn(
			state.selectedVersion.path,
			['cli', `--sketch=${dirname(resource.fsPath)}`, '--run'],
			{
				shell: false,
			}
		);
		proc.stdout.on("data", (data) => {
			provider.webview?.webview.postMessage({ type: 'stdout', value: data?.toString() });
		});
		proc.stderr.on("data", (data) => {
			provider.webview?.webview.postMessage({ type: 'stderr', value: data?.toString() });
			// TODO: Handle and highlight errors in the editor
		});
		proc.on('close', (code) => {
			provider.webview?.webview.postMessage({ type: 'close', value: code?.toString() });
			sketchProcess = undefined;
		});
		provider.webview?.show?.(true);
		provider.webview?.webview.postMessage({ type: 'clear'});
		sketchProcess = proc;
	});

	const stopSketch = commands.registerCommand('processing.sketch.stop', () => {
		if (sketchProcess === undefined) {
			return;
		}
		treeKill(sketchProcess?.pid as number);
	});

	context.subscriptions.push(
		register,
		startSketch,
		stopSketch
	);
}

// TODO: Add setting for timestamps
// TODO: Add setting for collapsing similar messages
// TODO: Add option to enable/disable stdout and stderr
class ProcessingConsoleViewProvider implements WebviewViewProvider {
	public webview?: WebviewView;

	public resolveWebviewView(webviewView: WebviewView, context: WebviewViewResolveContext): Thenable<void> | void {
		webviewView.webview.options = { enableScripts: true };
		webviewView.webview.html = `
				<!DOCTYPE html>
				<html>
					<body>
						<script>
							window.addEventListener('message', event => {

								const message = event.data; // The JSON data our extension sent

								const isScrolledToBottom = (window.innerHeight + window.scrollY) >= document.body.offsetHeight;

								const ts = document.createElement("span");
								ts.style.color = "gray";
								const now = new Date();
								const hours = now.getHours().toString().padStart(2, '0');
								const minutes = now.getMinutes().toString().padStart(2, '0');
								const seconds = now.getSeconds().toString().padStart(2, '0');
								ts.textContent = "[" + hours + ":" + minutes + ":" + seconds + "] ";
								

								switch (message.type) {
									case 'clear':
										document.body.innerHTML = '';
										break;
									case 'stdout':
										var pre = document.createElement("pre");
										pre.style.color = "white";
										pre.textContent = message.value;
										if (pre.textContent.endsWith("\\n")) {
											pre.textContent = pre.textContent.slice(0, -1);
										}
										pre.prepend(ts);
										document.body.appendChild(pre);
										break;
									case 'stderr':
										var pre = document.createElement("pre");
										pre.style.color = "red";
										pre.textContent = message.value;
										if (pre.textContent.endsWith("\\n")) {
											pre.textContent = pre.textContent.slice(0, -1);
										}
										pre.prepend(ts);
										document.body.appendChild(pre);
										break;
									case 'close':
										var pre = document.createElement("pre");
										pre.style.color = "gray";
										pre.textContent = "Process exited with code " + message.value;
										pre.prepend(ts);
										document.body.appendChild(pre);
										break;
								}

								if (isScrolledToBottom) {
									window.scrollTo(0, document.body.scrollHeight);
								}
							});
						</script>
					</body>
				</html>
				`;
		webviewView.onDidDispose(() => {
			commands.executeCommand("processing.sketch.stop");
		});
		this.webview = webviewView;
	}

}