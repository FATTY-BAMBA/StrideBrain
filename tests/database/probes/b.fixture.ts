import { it } from "vitest";
import { rowProbe } from "./row";
it("worker B sees only its own committed change", () => rowProbe("b"), 20000);
