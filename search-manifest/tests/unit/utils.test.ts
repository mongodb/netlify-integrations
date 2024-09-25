import { joinUrl } from '../../src/uploadToAtlas/utils';
import { expect, it } from 'vitest';

//test joinUrl util
it("correctly joins base URLs with slugs", function () {
  expect(joinUrl({ base: "https://example.com//", path: "//foo/" })).toEqual(
    "https://example.com/foo/"
  );
  expect(joinUrl({ base: "https://example.com", path: "foo" })).toEqual(
    "https://example.com/foo"
  );
});
