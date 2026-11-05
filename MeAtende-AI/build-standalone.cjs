/* Gera MeAtendeAI.html — versão standalone (CSS+JS+fonte embutidos, abre com duplo clique). */
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

(async () => {
  // 1. Bundle dos ES modules em um único IIFE
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, 'js/app.js')],
    bundle: true,
    format: 'iife',
    minify: true,
    target: 'es2020',
    write: false,
    legalComments: 'none'
  });
  let js = result.outputFiles[0].text;
  js = js.replace(/<\/script/gi, '<\\/script'); // segurança ao embutir

  // 2. CSS inline (na ordem do index.html) + fonte embutida em base64
  const cssFiles = ['base.css', 'layout.css', 'components.css', 'pages.css', 'animations.css', 'responsive.css', 'theme.css'];
  let css = cssFiles.map(f => fs.readFileSync(path.join(ROOT, 'css', f), 'utf8')).join('\n');
  const fontBuf = fs.readFileSync(path.join(ROOT, 'assets/fonts/plus-jakarta-sans-latin.woff2'));
  const fontData = 'data:font/woff2;base64,' + fontBuf.toString('base64');
  css = css.replace(/url\(['"]?\.\.\/assets\/fonts\/plus-jakarta-sans-latin\.woff2['"]?\)/g, () => `url('${fontData}')`);

  // 3. Favicon como data URI
  const favicon = fs.readFileSync(path.join(ROOT, 'assets/favicon.svg'), 'utf8');
  const favData = 'data:image/svg+xml;base64,' + Buffer.from(favicon).toString('base64');

  // 4. HTML final
  let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  html = html.replace(/<link rel="preload"[^>]*>\s*/, ''); // fonte já embutida no CSS
  html = html.replace(/<link rel="icon"[^>]*>/, () => `<link rel="icon" type="image/svg+xml" href="${favData}">`);
  html = html.replace(/(?:<link rel="stylesheet"[^>]*>\s*)+/, () => `<style>\n${css}\n</style>\n`);
  html = html.replace(/<script src="config.js"><\/script>/, () => `<script>window.MEATENDE_CONFIG={mode:'demo',apiBaseUrl:''};</script>`);
  html = html.replace(/<script type="module"[^>]*><\/script>/, () => `<script>\n${js}\n</script>`);

  const out = path.join(ROOT, 'MeAtendeAI.html');
  fs.writeFileSync(out, html);
  console.log('OK:', out, `(${(html.length / 1024).toFixed(0)} KB)`);
})().catch(e => { console.error(e); process.exit(1); });
