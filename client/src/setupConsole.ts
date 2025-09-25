import { ChildProcess, spawn } from 'child_process';
import { commands, ExtensionContext, Uri, WebviewView, WebviewViewProvider, WebviewViewResolveContext, window, workspace } from 'vscode';
import { state } from './extension';
import { dirname } from 'path';
import * as treeKill from 'tree-kill';

export default function setupConsole(context: ExtensionContext) {
	const sketchProcesses: ChildProcess[] = [];

	const provider = new ProcessingConsoleViewProvider();

	const register = window.registerWebviewViewProvider('processingConsoleView', provider);

	const startSketch = commands.registerCommand('processing.sketch.run', (resource: Uri, extraArguments: string[]) => {
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

		const extraArgs = [];
		if (Array.isArray(extraArguments)) {
			extraArgs.push(...extraArguments);
		}

		const proc = spawn(
			state.selectedVersion.path,
			['cli', `--sketch=${dirname(resource.fsPath)}`, ...extraArgs, '--run'],
			{
				shell: false,
			}
		);
		proc.stdout.on("data", (data) => {
			if (proc != sketchProcesses[0]) {
				// If this is not the most recent process, ignore its output
				return;
			}
			provider.webview?.webview.postMessage({ type: 'stdout', value: data?.toString() });
		});
		proc.stderr.on("data", (data) => {
			if (proc != sketchProcesses[0]) {
				// If this is not the most recent process, ignore its output
				return;
			}
			provider.webview?.webview.postMessage({ type: 'stderr', value: data?.toString() });
			// TODO: Handle and highlight errors in the editor
		});
		proc.on('close', (code) => {
			provider.webview?.webview.postMessage({ type: 'close', value: code?.toString() });
			sketchProcesses.splice(sketchProcesses.indexOf(proc), 1);
			commands.executeCommand('setContext', 'processing.sketch.running', sketchProcesses.length > 0);
		});
		provider.webview?.show?.(true);
		provider.webview?.webview.postMessage({ type: 'clear' });
		sketchProcesses.unshift(proc);
		commands.executeCommand('setContext', 'processing.sketch.running', true);
	});

	const restartSketch = commands.registerCommand('processing.sketch.restart', (resource: Uri) => {
		commands.executeCommand('processing.sketch.run', resource);
	});

	const stopSketch = commands.registerCommand('processing.sketch.stop', () => {
		for (const proc of sketchProcesses) {
			treeKill(proc.pid as number);
		}
	});

	const buildSketch = commands.registerCommand('processing.sketch.export', () => {
		commands.executeCommand('processing.sketch.run', undefined, ['--export']);
	});


	context.subscriptions.push(
		register,
		startSketch,
		restartSketch,
		stopSketch,
		buildSketch
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