# Capture24 Labeling Project


## Overview

Welcome to the Capture24 Labeling Project repository. This web application is designed for efficient and intuitive labeling of images in the Capture24 project. It provides a platform for annotating and classifying images collected over a 24-hour cycle.

## Prerequisites

Before setting up and launching the website, ensure you meet the following prerequisites:

- BMRC Account: An active BMRC (Biomedical Research Centre) account is required to access and work with the image datasets and other project-related resources.
- Node.js: This website runs on Node.js. Ensure that Node.js is installed in your BMRC environment. Visit Node.js official website for more information.

## Installation

Follow these steps within your BMRC account:

1. **Clone the Repository:**\
Clone this repository into your BMRC environment:
``` bash
git clone https://github.com/your-username/capture24-labeling-project.git
```

2. **Navigate to the Repository Directory:**\
Change to the cloned repository's directory:

```bash
cd capture24-labeling-project
```
3. **Install Node.js Dependencies:**\
Install the required Node.js dependencies:
```bash
npm install
```
## Launching the Website

After installing the project, follow these steps to start the server and access the website:

1. **Start the Server on BMRC:**\
Launch the server by running:
```bash
node server.js
```
This will start the server on the designated port.

**2. Set Up SSH Tunneling:**\
On your local machine, set up an SSH tunnel to the BMRC server for port forwarding. This can typically be done using a command like:
```graphql
 ssh -L 8080:localhost:3000 your_username@bmrc_server
```

**3. Access the Website:**
Open a web browser on your local machine and navigate to http://localhost:8080
