import { bench } from "vitest";
import { getCompletions } from "./utils";

bench(async () => {
    await getCompletions('top');
})