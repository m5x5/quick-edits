import { assert, describe, expect, it } from "vitest";
import { getCompletions } from "./utils";

describe('tailwindcss intellisense works', () => {
  it('should test getCompletions', async () => {
    console.log(await getCompletions('t'))
    assert(expect(await getCompletions('t')).contain('text-bold'));
    assert(expect(await getCompletions('')).contain('text-bold'));
    assert(expect(await getCompletions('top')).contain('top-96'));
  });
})
