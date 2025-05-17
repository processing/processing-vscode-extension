import { exec, execSync } from 'child_process';
import { join } from 'path/posix';
import { ExtensionContext, workspace, window, Uri, FileType } from 'vscode';
import { compareVersions } from './compareVersions';
import { ProcessingVersion, state } from './extension';

export async function setupSelectedVersion(context: ExtensionContext) {
	// TODO: Rerun this function when the user changes the version in the settings

	const config = workspace.getConfiguration('processing');

	let binaryPath = context.asAbsolutePath(join(`install-locator-${process.platform}`, 'bin', 'install-locator'));
	const javaPath = context.asAbsolutePath(join(`install-locator-${process.platform}`, 'bin', 'java'));

	await new Promise<void>((resolve, reject) => {
		// add executable permissions to the binary
		if (process.platform !== "win32") {
			exec(`chmod +x ${binaryPath}`, (error, stdout, stderr) => {
				if (error) {
					reject(error);
				}
				if (stderr) {
					reject(stderr);
				}
				resolve();
			});

			// add executable permissions to the java binary
			exec(`chmod +x ${javaPath}`, (error, stdout, stderr) => {
				if (error) {
					reject(error);
				}
				if (stderr) {
					reject(stderr);
				}
				resolve();
			});
		} else {
			// on windows we need to add the .bat to the binary path
			binaryPath = `${binaryPath}.bat`;
			resolve();
		}
	}).catch((e) => {
		console.error(`Error setting permissions for ${binaryPath}: ${e}`);
		window.showErrorMessage(`Error setting permissions for ${binaryPath}: ${e}`);
	});

	const versions = await new Promise<ProcessingVersion[]>((resolve, reject) => {
		exec(binaryPath, (error, stdout, stderr) => {
			if (error) {
				reject(error);
			}
			if (stderr) {
				reject(stderr);
			}
			const jsArray = stdout
				// remove the square brackets
				.replace("[", "")
				.replace("]", "")
				// split into array items
				.split(',')
				.map(s => s.trim().split("^"))
				.map(v => ({ path: v[0], version: v[1] }))
				// order by semver
				.sort((a, b) => compareVersions(a.version, b.version))
				.reverse();

			;
			resolve(jsArray);
		});
	}).catch((e) => {
		console.error(`Error getting Processing versions: ${e}`);
		window.showErrorMessage(`Error getting Processing versions: ${e}`);
	});
	if (!versions || versions.length === 0) {
		await window.showErrorMessage(
			`Processing not found, please install Processing 4.4.5 or higher and open it at least once.`
		);
		return;
	}
	console.log(`Found Processing versions: ${versions.map(v => `${v.version} ${v.path}`).join(", ")}`);

	const desiredVersion = config.get("version");

	let selectedVersion: ProcessingVersion | undefined = undefined;
	for (const app of versions) {
		if (desiredVersion !== "latest" && app.version !== desiredVersion) {
			console.warn(`Version (${app.version}) does not match the desired version (${desiredVersion}).`);
			continue;
		}
		// Check if the path is a executable file
		try {
			const stat = await workspace.fs.stat(Uri.file(join(app.path)));
			if (stat.type !== FileType.File) {
				console.warn(`Path (${app.path}) is not a file.`);
				continue;
			}
			const version = execSync(`"${app.path}" --version`, { encoding: 'utf-8' });
			if (!version || !version.includes(app.version)) {
				console.warn(`Version (${app.version}) at ${app.path} does not match the expected version.`);
				continue;
			}

			selectedVersion = app;
		} catch (e) {
			console.warn(`Checking version (${app.version}) at ${app.path} failed. ${e}`);
			continue;
		}

	}

	if (!selectedVersion) {
		await window.showErrorMessage(
			`Desired Processing version not found, please install Processing ${desiredVersion} and open it at least once. Found versions: ${versions.map(v => v.version).join(", ")}`
		);
		return;
	}
	state.selectedVersion = selectedVersion;
}
