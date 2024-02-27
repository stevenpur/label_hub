function setupImageClickListener(img, index) {
    img.addEventListener('click', function (event) {
        if (event.shiftKey && lastClickedImgIndex !== null) {
            const start = Math.min(index, lastClickedImgIndex);
            const end = Math.max(index, lastClickedImgIndex);

            // select multiple images if shift key is pressed
            for (let i = start; i <= end; i++) {
                // check if the child is a image or a container
                if (gallery.children[i].classList.contains('image-container')) {
                    // find the image inside the container
                    const image = gallery.children[i].querySelector('.gallery-image');
                    image.classList.add('selected-image');
                } else {
                    gallery.children[i].classList.add('selected-image');
                }
            }
        } else {
            // toggle selected image class
            img.classList.toggle('selected-image');
            lastClickedImgIndex = index;
        }
    });
}

function convertDate(dateString) {
    let year = dateString.substring(0, 4);
    let month = dateString.substring(4, 6);
    let day = dateString.substring(6, 8);
    let hour = dateString.substring(9, 11);
    let minute = dateString.substring(11, 13);
    let second = dateString.substring(13, 15);

    const readableDate = `${day}/${month}/${year} ${hour}:${minute}:${second}`;
    return readableDate;
}

function loadSingleImage(src, index, gallery, individual) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        //img.loading = "lazy";
        img.classList.add('gallery-image');
        setupImageClickListener(img, index); // Setup click listener for each image

        // Append the image to the DOM first
        gallery.appendChild(img);

        // Then set up the onload and onerror handlers
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image ${src}`));

        // listen for double click event
        img.addEventListener('dblclick', function () {
            // open the image in a new tab
            window.open(img.src);
        });

        // add the date to a image container
        const dateStr = img.src.split('/').pop().substring(17, 32);
        const date = convertDate(dateStr);
        // convert the date to a human-readable format
        imageContainer = document.createElement('div');
        imageContainer.className = 'image-container';
        // create and append the date to the container
        const dateElement = document.createElement('span');
        dateElement.innerText = date;
        dateElement.className = 'image-date';
        imageContainer.appendChild(dateElement);

        // move the image into this container
        img.parentNode.insertBefore(imageContainer, img);
        imageContainer.appendChild(img);

        // check if the image is already labeled
        //console.log('Checking if image is already labeled');
        const isLabelled = labelResult.find(result => {
            return (result.src == img.src && result.ind === individual);
        });
        if (isLabelled) {
            console.log('Image is already labelled');
            console.log(isLabelled.label);
            assignLabelToImage(img, isLabelled.label, individual);
        }
    });
}

async function loadImages(individual) {
    try {
        let imgLoadedCount = 0;
        const pgbar = document.getElementById('progress-bar');
        const gallery = document.getElementById('gallery');
        pgbar.value = 0;
        gallery.innerHTML = ''; // Clear the gallery

        const response = await fetch('/images');
        const images = await response.json();

        const cur_ind = document.getElementById('individual-selector').value;
        pgbar.max = images.length;

        for (let index = 0; index < images.length; index++) {
            const current_ind = document.getElementById('individual-selector').value;
            if (cur_ind != current_ind) {
                break;
            }
            const imageSrc = `/external-images/${images[index]}`;
            try {
                await loadSingleImage(imageSrc, index, gallery, individual);
                //console.log('Image', cur_ind, ':', images[index], 'loaded successfully');
                imgLoadedCount++;
                pgbar.value = imgLoadedCount;
            } catch (e) {
                console.error('Error loading image:', images[index], e);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function addLabelsToResults(img, label, ind) {
    const imageName = img.src.split('/').pop();
    const existingLabel = labelResult.find(result => {
        if (result.src === img.src && result.ind === ind) {
            return true;
        }
    });
    console.log('adding label to results')
    console.log(existingLabel);
    console.log(labelResult)
    //console.log(existingLabel);
    if (existingLabel) {
        existingLabel.label = label;
    } else {
        labelResult.push({ src: img.src, label: label, ind: ind });
    }

}

function assignLabelToImage(img, label, curInd) {
    // check if the image already has a container
    let imageContainer;
    if (img.parentNode.classList.contains('image-container')) {
        imageContainer = img.parentNode;
        // remove any existing label
        const existingLabel = imageContainer.querySelector('.image-label');
        if (existingLabel) {
            existingLabel.remove();
        }
    } else {
        // create a container for the image and label
        imageContainer = document.createElement('div');
        imageContainer.className = 'image-container';

        // move the image into this container
        img.parentNode.insertBefore(imageContainer, img);
        imageContainer.appendChild(img);
    }
    // create and append the label to the container
    const labelElement = document.createElement('span');
    labelElement.innerText = label;
    labelElement.className = 'image-label';
    imageContainer.appendChild(labelElement);
    // add the label to the results
    addLabelsToResults(img, label, curInd);
    // unselect the image
    img.classList.remove('selected-image');
}

function applySavedLabel(img, imageName) {
    // savedLabel is a list of structs, each with a src and label
    if (savedLabels) {
        const savedLabel = savedLabels.find(label => label.src === imageName);
        if (savedLabel) {
            assignLabelToImage(img, savedLabel.label);
        }
    }
}

function setIndSelector() {
    // add the individual selector options (P001, P002, ... P020)
    const indSelector = document.getElementById('individual-selector');
    const labels = Array.from({ length: 20 }, (_, i) => `P${(i + 1).toString().padStart(3, '0')}`);
    labels.forEach(label => {
        const option = document.createElement('option');
        option.value = label;
        option.text = label;
        indSelector.appendChild(option);
    });
}

function indChange() {
    const individual = document.getElementById('individual-selector').value;
    fetch(`/set-individual?individual=${individual}`)
        .then(response => response.json())
        .then(data => {
            // clear the gallery
            const gallery = document.getElementById('gallery');
            gallery.innerHTML = '';
            // load the images
            loadImages(individual);
        })
        .catch(error => console.error('Error:', error));
}

function translateShortLabels(label) {
    switch (label) {
        case 'se':
            return 'sedantry eating';
        case 'sme':
            return 'sedantry maybe eating';
        case 's':
            return 'sedantry not eating';
        case 'ae':
            return 'active eating';
        case 'ame':
            return 'active maybe eating';
        case 'a':
            return 'active not eating';
        default:
            // pop up a message to the user
            alert('Invalid label');
            return '';
    }
}


let labelResult = [];

// add the images to the gallery
document.addEventListener('DOMContentLoaded', function () {
    // set variables
    let lastClickedImgIndex = null;
    let imgLoadedCount = 0;

    setIndSelector() // Set the individual selector options
    indChange(); //
    const indSelector = document.getElementById('individual-selector');
    indSelector.addEventListener('change', indChange); // Set the individual selector change event

    // fetch the saved labels and apply them to the images
    /*const loadLabelsButton = document.getElementById('load-labels');
    loadLabelsButton.addEventListener('click', function () {
        fetch('/get-saved-labels')
            .then(response => response.json())
            .then(savedLabels => {
                const images = document.querySelectorAll('.gallery-image');
                images.forEach(img => {
                    const imageName = img.src.split('/').pop();
                    applySavedLabel(img, imageName);
                });
            })
            .catch(error => console.error('Error:', error));
    });*/

    // listen to the slider for changing the image size
    document.getElementById('img-size-slider').addEventListener('input', function (event) {
        const size = event.target.value;
        const container = document.querySelector('.slider-container');
        container.style.gridTemplateColumns = `repeat(auto-fit, ${size}px)`
    });


    // add the labels from the label input
    const labelForm = document.getElementById('quick-annotation');
    labelForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const labelInput = document.getElementById('label-input');
        const selectedImages = document.querySelectorAll('.gallery-image.selected-image');
        const curInd = document.getElementById('individual-selector').value;
        const label = translateShortLabels(labelInput.value);
        selectedImages.forEach(img => {
            assignLabelToImage(img, label, curInd);
        });
    });

    // add the labels to the label selector
    const assignLabelButton = document.getElementById('assign-label');
    assignLabelButton.addEventListener('click', function () {
        const labelSelector = document.getElementById('label-selector');
        const selectedLabelText = labelSelector.options[labelSelector.selectedIndex].text;
        const selectedImages = document.querySelectorAll('.gallery-image.selected-image');
        const curInd = document.getElementById('individual-selector').value;
        selectedImages.forEach(img => {
            assignLabelToImage(img, selectedLabelText, curInd);
        });
    });

    //download the labels
    const downloadLabelsButton = document.getElementById('download-labels');
    downloadLabelsButton.addEventListener('click', function () {
        const data = JSON.stringify(labelResult);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'labels.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
    });

    // accept the uploaded labels
    const uploadLabelsButton = document.getElementById('load-button');
    console.log(uploadLabelsButton)
    uploadLabelsButton.addEventListener('click', function () {
        const fileInput = document.getElementById('upload-file-input');
        const file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const contents = e.target.result;
                labelResult = JSON.parse(contents);
                curInd = document.getElementById('individual-selector').value;
                loadImages(curInd);
            }
            reader.readAsText(file);
        } else {
            alert('No file selected');
        }
    });

    // save the labels
    const saveLabelsButton = document.getElementById('download-labels');
    saveLabelsButton.addEventListener('click', function () {
        console.log(labelResult);
        // Send the data to the server
        fetch('/save-labels', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(labelResult)
        })
            .then(response => response.json())
            .then(data => console.log(data))
            .catch(error => console.error('Error:', error));
    });
});