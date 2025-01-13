const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');

const CSS_DIR = './public/style';

const CSS_MINIFY_OPTIONS = {
    level: 2,
    format: false
};

async function minifyCss() {
    // 获取所有 CSS 文件
    const files = fs.readdirSync(CSS_DIR)
    .filter(file => file.endsWith('.css'))
    .filter(file => !file.endsWith('.min.css'));

    // 初始化 CleanCSS
    const minifier = new CleanCSS(CSS_MINIFY_OPTIONS);

    // 处理每个文件
    for (const file of files) {
        const inputPath = path.join(CSS_DIR, file);
        const outputPath = path.join(CSS_DIR, file.replace('.css', '.min.css'));
        
        // 读取文件内容
        const css = fs.readFileSync(inputPath, 'utf8');
        
        // 压缩 CSS
        const minified = minifier.minify(css);
        
        // 检查是否有错误
        if (minified.errors.length > 0) {
            throw new Error(`Error minifying ${file}: ${minified.errors.join(', ')}`);
        }

        // 写入压缩后的文件
        fs.writeFileSync(outputPath, minified.styles);
    }
}

minifyCss().catch(console.error);