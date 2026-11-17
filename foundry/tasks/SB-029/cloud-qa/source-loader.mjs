import { registerHooks, createRequire } from 'node:module';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const workspace = process.env.SB029_PREVIEW_WORKSPACE;
const require = createRequire(resolve(workspace, 'package.json'));
const ts = require('typescript');

function sourceCandidate(path) {
  for (const candidate of [path, `${path}.ts`, `${path}.tsx`, `${path}.js`, resolve(path, 'index.ts')]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return pathToFileURL(candidate).href;
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      const url = sourceCandidate(resolve(workspace, 'src', specifier.slice(2)));
      if (!url) throw new Error('PREVIEW_SOURCE_IMPORT_UNAVAILABLE');
      return { url, shortCircuit: true };
    }
    if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.startsWith('file:')) {
      const candidate = resolve(dirname(fileURLToPath(context.parentURL)), specifier);
      if (!extname(candidate)) {
        const url = sourceCandidate(candidate);
        if (url) return { url, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith('file:') && /\.(ts|tsx)$/.test(url)) {
      const filename = fileURLToPath(url);
      if (!filename.startsWith(`${workspace}/src/`) && !filename.startsWith(`${workspace}/.generated/`)) {
        throw new Error('PREVIEW_SOURCE_SCOPE_REJECTED');
      }
      const source = ts.transpileModule(readFileSync(filename, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
        fileName: filename,
      }).outputText;
      return { format: 'module', source, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});
