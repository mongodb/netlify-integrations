import { generateManifest } from "../../src";

export const getManifest = async (manifestName: string) => {
  process.chdir(`./documents/docs-${manifestName}`);
  const manifest = await generateManifest();
  process.chdir(`../../../`);
  return manifest;
};
