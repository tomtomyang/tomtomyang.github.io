const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');
const { minify } = require('html-minifier');

const TEMPLATE = './src/template/layout.html';

async function build() {
    // 读取模板
    const template = await fs.readFile(TEMPLATE, 'utf-8');
    
    // 读取所有 markdown 文件
    const contentDir = './src/content';
    const files = await fs.readdir(contentDir);
    
    // HTML 压缩配置
    const minifyOptions = {
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
    
    // 处理每个 markdown 文件
    for (const file of files) {
        if (path.extname(file) === '.md') {
            const content = await fs.readFile(path.join(contentDir, file), 'utf-8');
            const { data, content: markdown } = matter(content);
            
            // 转换 markdown 为 HTML
            const htmlContent = marked.parse(markdown);
            
            // 替换模板变量
            let html = template;
            for (const [key, value] of Object.entries(data)) {
                html = html.replace(`{{${key}}}`, value);
            }
            html = html.replace('{{content}}', htmlContent);
            
            // 压缩 HTML
            const minifiedHtml = minify(html, minifyOptions);
            
            // 写入文件到根目录
            const outFile = path.join('./', file.replace('.md', '.html'));
            await fs.writeFile(outFile, minifiedHtml);
        }
    }
}

build().catch(console.error);
