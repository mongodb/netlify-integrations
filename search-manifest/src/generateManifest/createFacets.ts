import { NetlifyIntegration } from "@netlify/sdk";

export class Facet {
  category: string;
  value: string;
  subFacets: Array<Facet> | null;

  constructor(category: string, value: string, subFacets: Array<Facet>) {
    this.category = category;
    this.value = value;
    this.subFacets = subFacets;
    if (subFacets) {
      for (const subFacet of subFacets) {
        this.subFacets.push(
          new Facet(subFacet.category, subFacet.value, subFacet.subFacets ?? [])
        );
      }
    }
  }
}
