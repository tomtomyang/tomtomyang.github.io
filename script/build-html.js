const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');
const { minify } = require('html-minifier');

const TEMPLATE = './src/layout.html';
const CONTENT_DIR = './src/content';
const OUTPUT_DIR = '.';

// HTML 压缩配置
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
    // 读取模板
    const template = await fs.readFile(TEMPLATE, 'utf-8');
    
    // 读取所有 markdown 文件
    const files = await fs.readdir(CONTENT_DIR);

    
    // 处理每个 markdown 文件
    for (const file of files) {
        if (path.extname(file) === '.md') {
            const content = await fs.readFile(path.join(CONTENT_DIR, file), 'utf-8');
            const { data, content: markdown } = matter(content);
            
            // 转换 markdown 为 HTML
            const htmlContent = marked.parse(markdown);
            
            // 替换模板变量
            let html = template;
            for (const [key, value] of Object.entries(data)) {
                html = html.replaceAll(`{{${key}}}`, value);
            }
            html = html.replaceAll('{{content}}', htmlContent);
            
            // 压缩 HTML
            const minifiedHtml = minify(html, HTML_MINIFY_OPTIONS);
            
            // 写入文件到根目录
            const outFile = path.join(OUTPUT_DIR, file.replace('.md', '.html'));
            await fs.writeFile(outFile, minifiedHtml);
        }
    }
}

build().catch(console.error);
