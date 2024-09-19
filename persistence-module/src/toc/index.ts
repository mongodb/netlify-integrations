export interface Toc {
  title: string;
  slug?: string;
  url?: string;
  children: Toc[];
  options?: {
    [key: string]: any;
  };
}
