const fs = require('fs').promises;
const path = require('path');

const CleanCSS = require('clean-css');

const CSS_DIR = './public/style';

const CSS_MINIFY_OPTIONS = {
    level: 2,
    format: false
};

async function minifyCss() {
    let files = await fs.readdir(CSS_DIR);

    files = files.filter(file => file.endsWith('.css'))
    .filter(file => !file.endsWith('.min.css'));

    const minifier = new CleanCSS(CSS_MINIFY_OPTIONS);

    for (const file of files) {
        const inputPath = path.join(CSS_DIR, file);
        const outputPath = path.join(CSS_DIR, file.replace('.css', '.min.css'));
        
        const css = await fs.readFile(inputPath, 'utf8');
        const minified = minifier.minify(css);
        
        if (minified.errors.length > 0) {
            throw new Error(`Error minifying ${file}: ${minified.errors.join(', ')}`);
        }

        await fs.writeFile(outputPath, minified.styles);
    }
}

minifyCss().catch(console.error);