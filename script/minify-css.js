const fs = require('fs').promises;
const path = require('path');

const CleanCSS = require('clean-css');

const STYLE_DIR = './public/style';

const CSS_MINIFY_OPTIONS = {
    level: 2,
    format: false
};

async function minify(minifier, file) {
    const inputPath = path.join(STYLE_DIR, file);
    const outputPath = path.join(STYLE_DIR, file.replace('.css', '.min.css'));
    
    const css = await fs.readFile(inputPath, 'utf8');
    const minified = minifier.minify(css);
    
    if (minified.errors.length > 0) {
        throw new Error(`Error minifying ${file}: ${minified.errors.join(', ')}`);
    }

    await fs.writeFile(outputPath, minified.styles);
}

async function main() {
    let files = await fs.readdir(STYLE_DIR);

    files = files.filter(file => file.endsWith('.css'))
                 .filter(file => !file.endsWith('.min.css'));

    const minifier = new CleanCSS(CSS_MINIFY_OPTIONS);

    await Promise.all(
        files.map(file => minify(minifier, file))
    );
}

main().catch(console.error);
