import { NetlifyIntegration } from "@netlify/sdk";

export class Facet {
  category: any;
  value: any;
  subFacets: any;

  constructor(category: string, value: string, subFacets: []) {
    this.category = category;
    this.value = value;
    this.subFacets = [];

    if (subFacets) {
      for (const subFacet of subFacets) {
        this.subFacets.push(
          new Facet(
            subFacet["category"],
            subFacet["value"],
            subFacet["subFacets"] ?? []
          )
        );
      }
    }
  }
}
