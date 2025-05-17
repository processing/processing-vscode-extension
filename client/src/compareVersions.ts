export function compareVersions(a: string | undefined, b: string | undefined): number {
	const parseVersion = (v: string | undefined) => {
		if (!v || v === 'unspecified') { return []; }
		return v.split('.').map(n => parseInt(n, 10) || 0);
	};

	const aVersion = parseVersion(a);
	const bVersion = parseVersion(b);
	const maxLength = Math.max(aVersion.length, bVersion.length);

	for (let i = 0; i < maxLength; i++) {
		const diff = (aVersion[i] || 0) - (bVersion[i] || 0);
		if (diff !== 0) { return diff; }
	}

	return 0;
}
