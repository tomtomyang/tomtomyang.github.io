const fs = require('fs').promises;
const path = require('path');

const { marked } = require('marked');
const matter = require('gray-matter');
const { minify } = require('html-minifier');
const CleanCSS = require('clean-css');

const SRC_DIR = './src';
const OUTPUT_DIR = './dist';

const TEMPLATE = `${SRC_DIR}/layout.html`;
const CONTENT_DIR = `${SRC_DIR}/content`;
const HTML_OUTPUT_DIR = `${OUTPUT_DIR}`;

const STYLE_DIR = `${SRC_DIR}/style`;
const CSS_OUTPUT_DIR = `${OUTPUT_DIR}/style`;

const PUBLIC_DIR = './public';
const PUBLIC_OUTPUT_DIR = `${OUTPUT_DIR}/public`;

const HTML_MINIFY_OPTIONS = {
    removeComments: true,
    collapseWhitespace: true,
    minifyCSS: true,
    minifyJS: true,
    removeEmptyAttributes: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    useShortDoctype: true
};

async function buildHTML() {
    async function build(template, file) {
        if (path.extname(file) !== '.md') return;
        
        const content = await fs.readFile(path.join(CONTENT_DIR, file), 'utf-8');
        const { data, content: markdown } = matter(content);
        
        const htmlContent = marked.parse(markdown);

        let html = template;
        for (const [key, value] of Object.entries(data)) {
            html = html.replaceAll(`{{${key}}}`, value);
        }
        html = html.replaceAll('{{content}}', htmlContent);
        
        const minifiedHtml = minify(html, HTML_MINIFY_OPTIONS);
        
        const outFile = path.join(HTML_OUTPUT_DIR, file.replace('.md', '.html'));
        await fs.writeFile(outFile, minifiedHtml);
    }


    const template = await fs.readFile(TEMPLATE, 'utf-8');
    const files = await fs.readdir(CONTENT_DIR);
    
    await Promise.all(
        files.map(file => build(template, file))
    );
}

const CSS_MINIFY_OPTIONS = {
    level: 2,
    format: false
};

async function minifyCSS() {
    async function minify(minifier, file) {
        const inputPath = path.join(STYLE_DIR, file);
        const outputPath = path.join(CSS_OUTPUT_DIR, file.replace('.css', '.min.css'));

        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        
        const css = await fs.readFile(inputPath, 'utf8');
        const minified = minifier.minify(css);
        
        if (minified.errors.length > 0) {
            throw new Error(`Error minifying ${file}: ${minified.errors.join(', ')}`);
        }

        await fs.writeFile(outputPath, minified.styles);
    }

    let files = await fs.readdir(STYLE_DIR);

    files = files.filter(file => file.endsWith('.css'))
                 .filter(file => !file.endsWith('.min.css'));

    const minifier = new CleanCSS(CSS_MINIFY_OPTIONS);

    await Promise.all(
        files.map(file => minify(minifier, file))
    );
}

async function copyPublic() {
    async function copy(src, dest) {
        await fs.mkdir(dest, { recursive: true });
        const entries = await fs.readdir(src, { withFileTypes: true });

        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);

            if (entry.isDirectory()) {
                await copy(srcPath, destPath);
            } else {
                await fs.copyFile(srcPath, destPath);
            }
        }
    }

    if (!await fs.access(PUBLIC_DIR).then(() => true).catch(() => false)) {
        return;
    }

    await copy(PUBLIC_DIR, PUBLIC_OUTPUT_DIR);
}

async function clearOutput() {
    await fs.rm(OUTPUT_DIR, { recursive: true, force: true });
    await fs.mkdir(OUTPUT_DIR);
}

async function main() {
    await clearOutput();
    await copyPublic();
    await minifyCSS();
    await buildHTML();
}

main().catch(console.error);
