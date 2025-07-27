const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3001;

// Debug: Log startup info
console.log('=== DEBUG: Server Starting ===');
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('Process type:', process.pkg ? 'PKG Binary' : 'Node.js');

// Debug: Check what files exist in current directory
console.log('\n=== DEBUG: Files in __dirname ===');
try {
    const files = fs.readdirSync(__dirname);
    console.log('Files found:', files);
    
    // Check specifically for our web assets
    const webFiles = ['index.html', 'style.css', 'script.js'];
    webFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        const exists = fs.existsSync(filePath);
        console.log(`${file}: ${exists ? 'EXISTS' : 'MISSING'}`);
        if (exists) {
            const stats = fs.statSync(filePath);
            console.log(`  Size: ${stats.size} bytes`);
        }
    });
} catch (err) {
    console.log('Error reading directory:', err.message);
}

// Debug: Log all incoming requests
app.use((req, res, next) => {
    console.log(`\n=== DEBUG: ${new Date().toISOString()} ===`);
    console.log(`${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    next();
});

// Add CSP headers to allow all content (override any injected CSP)
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', 
        "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: http: https:; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: http: https:; " +
        "font-src 'self' data: http: https:; " +
        "connect-src 'self' http: https:; " +
        "media-src 'self' data: http: https:"
    );
    next();
});

// load the saved files
const label_fs = require('fs');
const img_fs = require('fs');
let savedLabels = [];
// Read the saved labels from file, if it exists
try {
    const data = label_fs.readFileSync('labels.json', 'utf8');
    savedLabels = JSON.parse(data);
} catch (err) {
    console.log('No saved labels found, starting fresh.');
    savedLabels = []; // Initialize with an empty array if file doesn't exist
}
app.get('/get-saved-labels', (req, res) => {
    res.json(savedLabels);
});

// Serve the static files
// Assuming this external path is accessible by your server
let externalImagesPath = '/well/doherty/projects/datasets/capture24-original';

console.log('\n=== DEBUG: Setting up static middleware ===');
console.log('External images path:', externalImagesPath);
console.log('Static root directory:', __dirname);

app.use('/external-images', express.static(externalImagesPath));

// Debug the static middleware
app.use(express.static(__dirname, {
    setHeaders: (res, path) => {
        console.log(`=== DEBUG: Static file requested: ${path} ===`);
    }
}));

// Explicitly serve index.html at root path
app.get('/', (req, res) => {
    console.log('=== DEBUG: Root route handler called ===');
    const indexPath = path.join(__dirname, 'index.html');
    console.log('Attempting to serve:', indexPath);
    console.log('File exists:', fs.existsSync(indexPath));
    
    res.sendFile('index.html', { root: __dirname }, (err) => {
        if (err) {
            console.log('=== DEBUG: Error serving index.html ===', err);
            res.status(500).send('Error serving index.html: ' + err.message);
        } else {
            console.log('=== DEBUG: index.html served successfully ===');
        }
    });
});

// set the image path according to selection of individual
app.get('/set-individual', (req, res) => {
    const individual = req.query.individual;
    console.log('Setting individual to:', individual);
    externalImagesPath = `/users/doherty/imh310/capture24/camera/${individual}`;
    console.log('New image path:', externalImagesPath)
    app.use('/external-images', express.static(externalImagesPath));
    res.json({ message: `Individual set to ${individual}` });
});

// grab the images from the server
app.get('/images', (req, res) => {
    img_fs.readdir(externalImagesPath, function (err, files) {
        if (err) {
            res.status(500).send('Unable to scan directory: ' + err);
            return;
        }
        // send a list of files to the client
        res.json(files);
    });
});

// Middleware to parse JSON bodies
app.use(bodyParser.json({ limit: '1mb' }));
app.post('/save-labels', (req, res) => {
    const data = req.body;
    // Write the data to a file
    fs.writeFile('labels.json', JSON.stringify(data, null, 2), 'utf8', (err) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error saving file');
            return;
        }
        res.json({ message: 'Labels saved successfully' });
    });
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
