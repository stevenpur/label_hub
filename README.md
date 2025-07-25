# Capture24 Labeling Project

## Overview

Welcome to the Capture24 Labeling Project repository. This web application is designed for efficient and intuitive labeling of images in the Capture24 project. It provides a platform for annotating and classifying images collected over a 24-hour cycle.

**New: Automated Launcher** - No more manual SSH setup! The project now includes a Go-based launcher that automatically handles server deployment, SSH tunneling, and browser opening.

## Quick Start (Recommended)

**Prerequisites:**
- BMRC account with SSH access to image datasets
- Go 1.19+ installed on your local machine

**Usage:**
1. **Build the launcher:**
```bash
git clone https://github.com/stevenpur/label_hub.git
cd label_hub
go build -o capture24-launcher main.go
```

2. **Run the launcher:**
```bash
./capture24-launcher
```

3. **Enter your SSH credentials when prompted:**
```
🚀 Capture24 Launcher
======================
Enter SSH Host: bmrc-server.ox.ac.uk
Enter Username: your_username
Enter Password: [hidden]
```

4. **Start labeling!**
   - The launcher automatically deploys the server, sets up port forwarding, and opens your browser
   - Navigate to the opened browser window at `http://localhost:8080`
   - Select your individual and start labeling images

**That's it!** No manual SSH commands, no port forwarding setup, no server installation.

## Developer Setup (Manual)

For development or if you prefer the manual approach:

**Prerequisites:**
- BMRC account access
- Node.js installed in your BMRC environment

**Steps:**
1. **Clone the repository:**
```bash
git clone https://github.com/stevenpur/label_hub.git
cd label_hub
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the server on BMRC:**
```bash
node server.js
```

4. **Set up SSH tunneling (on your local machine):**
```bash
ssh -L 8080:localhost:3001 your_username@bmrc_server
```

5. **Access the website:**
Open `http://localhost:8080` in your browser

## Building from Source

**To build the Go launcher:**
```bash
# Install dependencies
go mod tidy

# Build for your platform
go build -o capture24-launcher main.go

# Cross-compile for other platforms
GOOS=windows GOARCH=amd64 go build -o capture24-launcher.exe main.go
GOOS=darwin GOARCH=amd64 go build -o capture24-launcher-mac main.go
```

**To build the Node.js server binary:**
```bash
# Install pkg globally
npm install -g pkg

# Create standalone binary
pkg server.js --targets node18-linux-x64 --output capture24-server
```

## Limitations

This application currently has the following limitations:

- **Environment Dependency**: Requires BMRC account access and SSH connectivity to image server
- **Image Format Support**: Limited to common web-compatible image formats (JPEG, PNG, GIF)
- **Single User Session**: Designed for single-user labeling sessions; concurrent multi-user access may cause conflicts
- **Data Persistence**: Labels are stored in JSON format on the remote server; no database integration for advanced querying or backup
- **Browser Compatibility**: Optimized for modern browsers; legacy browser support not guaranteed
- **Scalability**: Performance may degrade with very large image datasets (>10,000 images)
- **Label Export**: Limited export options; currently supports JSON format only
- **Platform Support**: Go launcher requires Go runtime for building; pre-built binaries needed for non-technical users

## Architecture

The project consists of two main components:

1. **Node.js Web Server** (`server.js`): Serves the labeling interface and handles image serving from remote directories
2. **Go Launcher** (`main.go`): Automates deployment, SSH tunneling, and browser opening for seamless user experience

The Go launcher embeds the Node.js server binary and web assets, creating a single-file distribution that eliminates manual setup steps. 
