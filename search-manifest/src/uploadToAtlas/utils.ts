import crypto from 'crypto';

export function generateHash(data: string): Promise<string> {
	const hash = crypto.createHash('sha256');

	return new Promise((resolve, reject) => {
		hash.on('readable', () => {
			const data = hash.read();
			if (data) {
				resolve(data.toString('hex'));
			}
		});

		hash.write(data);
		hash.end();
	});
}

export function joinUrl(base: string, path: string): string {
	return base.replace(/\/*$/, '/') + path.replace(/^\/*/, '');
}
