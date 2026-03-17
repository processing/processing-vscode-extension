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

		// Line buffering to avoid fragmenting output across multiple timestamps
		let stdoutBuffer = '';
		let stderrBuffer = '';

		const sendCompleteLines = (buffer: string, type: 'stdout' | 'stderr'): string => {
			const lines = buffer.split('\n');
			// All but the last element are complete lines
			for (let i = 0; i < lines.length - 1; i++) {
				provider.webview?.webview.postMessage({ type, value: lines[i] + '\n' });
			}
			// Return the incomplete last line (or empty string if buffer ended with \n)
			return lines[lines.length - 1];
		};

		proc.stdout.on("data", (data) => {
			if (proc != sketchProcesses[0]) {
				return;
			}
			stdoutBuffer += data?.toString();
			stdoutBuffer = sendCompleteLines(stdoutBuffer, 'stdout');
		});
		proc.stderr.on("data", (data) => {
			if (proc != sketchProcesses[0]) {
				return;
			}
			stderrBuffer += data?.toString();
			stderrBuffer = sendCompleteLines(stderrBuffer, 'stderr');
		});
		proc.on('close', (code) => {
			// Flush any remaining buffered output
			if (stdoutBuffer) {
				provider.webview?.webview.postMessage({ type: 'stdout', value: stdoutBuffer });
			}
			if (stderrBuffer) {
				provider.webview?.webview.postMessage({ type: 'stderr', value: stderrBuffer });
			}
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
					<head>
						<style>
							body {
								color: var(--vscode-editor-foreground);
								background-color: var(--vscode-editor-background);
								margin: 0;
								padding: 8px;
								font-family: var(--vscode-editor-font-family);
								font-size: var(--vscode-editor-font-size);
							}

							pre {
								margin: 0;
								white-space: pre-wrap;
								word-break: break-word;
							}

							.console-timestamp {
								color: var(--vscode-descriptionForeground);
							}

							.console-stdout {
								color: var(--vscode-editor-foreground);
							}

							.console-stderr {
								color: var(--vscode-editorError-foreground);
							}

							.console-close {
								color: var(--vscode-descriptionForeground);
							}
						</style>
					</head>
					<body>
						<script>
							window.addEventListener('message', event => {

								const message = event.data; // The JSON data our extension sent

								const isScrolledToBottom = (window.innerHeight + window.scrollY) >= document.body.offsetHeight;
								const createTimestampText = () => {
									const now = new Date();
									const hours = now.getHours().toString().padStart(2, '0');
									const minutes = now.getMinutes().toString().padStart(2, '0');
									const seconds = now.getSeconds().toString().padStart(2, '0');
									return "[" + hours + ":" + minutes + ":" + seconds + "] ";
								};

								const appendConsoleLine = (lineClass, text) => {
									const pre = document.createElement("pre");
									pre.className = lineClass;

									const ts = document.createElement("span");
									ts.className = "console-timestamp";
									const timestampText = createTimestampText();
									const continuationPrefix = " ".repeat(timestampText.length);
									const normalizedText = String(text ?? "").replace(/\\n$/, "");
									ts.textContent = timestampText;
									pre.textContent = normalizedText.replaceAll("\\n", "\\n" + continuationPrefix);

									pre.prepend(ts);
									document.body.appendChild(pre);
								};
								

								switch (message.type) {
									case 'clear':
										document.body.innerHTML = '';
										break;
									case 'stdout':
										appendConsoleLine("console-stdout", message.value);
										break;
									case 'stderr':
										appendConsoleLine("console-stderr", message.value);
										break;
									case 'close':
										appendConsoleLine("console-close", "Process exited with code " + message.value);
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