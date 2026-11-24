import { it } from "vitest";
import { rowProbe } from "./row";
it("worker A sees only its own committed change", () => rowProbe("a"), 20000);
