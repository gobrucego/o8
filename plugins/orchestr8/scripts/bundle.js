import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

async function bundle() {
  try {
    // Clean dist directory
    await fs.rm(join(rootDir, 'dist'), { recursive: true, force: true });
    await fs.mkdir(join(rootDir, 'dist'), { recursive: true });

    console.log('Bundling MCP server...');

    await esbuild.build({
      entryPoints: [join(rootDir, 'src/index.ts')],
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'esm',
      outfile: join(rootDir, 'dist/index.js'),
      external: [], // Bundle everything
      sourcemap: true,
      minify: false, // Keep readable for debugging
      treeShaking: true,
    });

    // Make executable and add require polyfill after shebang
    const bundlePath = join(rootDir, 'dist/index.js');
    const content = await fs.readFile(bundlePath, 'utf-8');
    const lines = content.split('\n');

    // Insert require polyfill after shebang
    if (lines[0].startsWith('#!')) {
      lines.splice(1, 0, `import { createRequire } from 'module';const require = createRequire(import.meta.url);`);
      await fs.writeFile(bundlePath, lines.join('\n'));
    }

    await fs.chmod(bundlePath, 0o755);

    console.log('Bundle created successfully!');
  } catch (error) {
    console.error('Bundle failed:', error);
    process.exit(1);
  }
}

bundle();
