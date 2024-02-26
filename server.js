const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const port = 3000;

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
app.use('/external-images', express.static(externalImagesPath));
app.use(express.static(__dirname));

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