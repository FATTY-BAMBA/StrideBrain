/** Dependency-free declaration scanner. Comments, strings and URLs cannot supply CSS values. */
export type Counts = { color: number; fontSize: number; radius: number };
export const zeroCounts = (): Counts => ({ color: 0, fontSize: 0, radius: 0 });
const colorNames = new Set(
  `aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen`.split(
    /\s+/,
  ),
);
const rawFunctions = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\s*\(/gi;
function unquoted(css: string): string {
  return css.replace(
    /\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|url\((?:\\.|[^)])*\)/gi,
    (text) => text.replace(/[^\n]/g, " "),
  );
}
export function declarations(css: string) {
  return [...unquoted(css).matchAll(/([\w-]+)\s*:\s*([^;{}]+)(?=;|})/g)].map((match) => ({
    property: match[1]!.toLowerCase(),
    value: match[2]!.trim(),
    line: unquoted(css).slice(0, match.index).split("\n").length,
  }));
}
export function countViolations(css: string): Counts {
  const counts = zeroCounts();
  for (const { property, value } of declarations(css)) {
    const withoutNames = value.replace(/--[\w-]+/g, "");
    counts.color += [...withoutNames.matchAll(/#[\da-f]{3,8}\b/gi)].length;
    counts.color += [...withoutNames.matchAll(rawFunctions)].length;
    counts.color += [...withoutNames.matchAll(/[a-z][a-z-]*/gi)].filter(([word]) =>
      colorNames.has(word.toLowerCase()),
    ).length;
    const tokenOnly = /^(?:var\(--[\w-]+\)\s*)+(?:!important)?$/.test(value);
    if (property === "font-size" && !tokenOnly) counts.fontSize++;
    if (/^border-(?:(?:top|bottom)-(?:left|right)-)?radius$/.test(property) && !tokenOnly)
      counts.radius++;
  }
  return counts;
}
export function compareCounts(
  file: string,
  actual: Counts,
  allowed: Counts = zeroCounts(),
): string[] {
  return (Object.keys(actual) as (keyof Counts)[])
    .filter((key) => actual[key] > allowed[key])
    .map(
      (key) =>
        `${file}: ${key} has ${actual[key]} raw values; baseline permits ${allowed[key]}. Use a design token.`,
    );
}
