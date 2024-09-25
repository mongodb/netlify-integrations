import type { ManifestEntry } from './manifestEntry';

export class Manifest {
	url: string;
	global?: boolean;
	documents: ManifestEntry[];

	constructor(url = '', includeInGlobalSearch = false) {
		this.url = url;
		this.documents = [];
		this.global = includeInGlobalSearch;
	}

	addDocument(document: ManifestEntry | null) {
		//Add a document to the manifest
		if (document) {
			this.documents.push(document);
		}
	}

	export() {
		//return the manifest as json
		const manifest = {
			url: this.url,
			includeInGlobalSearch: this.global,
			documents: this.documents,
		};

		return manifest;
	}
}
