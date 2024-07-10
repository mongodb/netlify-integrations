import { NetlifyIntegration } from "@netlify/sdk";

export class Facet {
  category: any;
  value: any;
  subFacets: any;

  constructor(facetEntry: any) {
    this.category = facetEntry.category;
    this.value = facetEntry.value;
    this.subFacets = facetEntry.subFacets;
  }
}
