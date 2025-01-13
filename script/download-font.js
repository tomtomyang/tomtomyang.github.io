const fs = require('fs');
const path = require('path');
const https = require('https');

const FONT_CSS_FILE = './public/style/font.css';
const FONT_DIR = './public/font';

async function downloadFont() {
    // 读取 CSS 文件
    const cssFile = fs.readFileSync(FONT_CSS_FILE, 'utf8');

    // 提取所有 woff2 URL
    const urls = cssFile.match(/url\((.*?\.woff2)\)/g)
        .map(url => url.replace('url(', '').replace(')', ''));

    // 创建目标目录
    if (!fs.existsSync(FONT_DIR)){
        fs.mkdirSync(FONT_DIR, { recursive: true });
    }

    // 下载所有文件
    const downloadPromises = urls.map(url => {
        return new Promise((resolve, reject) => {
            // 检查是否已经是本地路径
            if (url.startsWith('../font/') || url.startsWith('./font/')) {
                resolve();
                return;
            }

            const fileName = path.basename(url);
            const filePath = path.join(FONT_DIR, fileName);
            
            https.get(url, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to download ${fileName}: ${response.statusCode}`));
                    return;
                }

                const fileStream = fs.createWriteStream(filePath);
                response.pipe(fileStream);
                
                fileStream.on('finish', () => {
                    fileStream.close();
                    resolve();
                });

                fileStream.on('error', (err) => {
                    reject(new Error(`Error writing ${fileName}: ${err.message}`));
                });
            }).on('error', (err) => {
                reject(new Error(`Error downloading ${fileName}: ${err.message}`));
            });
        });
    });

    // 等待所有下载完成
    await Promise.all(downloadPromises);

    // 更新 CSS 文件中的路径
    let newCss = cssFile;
    urls.forEach(url => {
        newCss = newCss.replace(
            url,
            `../font/${path.basename(url)}`
        );
    });

    fs.writeFileSync(FONT_CSS_FILE, newCss);
}

downloadFont().catch(console.error);