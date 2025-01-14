const fs = require('fs').promises;
const path = require('path');

const { marked } = require('marked');
const matter = require('gray-matter');
const { minify } = require('html-minifier');

const TEMPLATE = './src/layout.html';
const CONTENT_DIR = './src/content';
const OUTPUT_DIR = '.';

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

async function build() {
    const template = await fs.readFile(TEMPLATE, 'utf-8');
    const files = await fs.readdir(CONTENT_DIR);

    for (const file of files) {
        if (path.extname(file) === '.md') {
            const content = await fs.readFile(path.join(CONTENT_DIR, file), 'utf-8');
            const { data, content: markdown } = matter(content);
            
            const htmlContent = marked.parse(markdown);

            let html = template;
            for (const [key, value] of Object.entries(data)) {
                html = html.replaceAll(`{{${key}}}`, value);
            }
            html = html.replaceAll('{{content}}', htmlContent);
            
            const minifiedHtml = minify(html, HTML_MINIFY_OPTIONS);
            
            const outFile = path.join(OUTPUT_DIR, file.replace('.md', '.html'));
            await fs.writeFile(outFile, minifiedHtml);
        }
    }
}

build().catch(console.error);
