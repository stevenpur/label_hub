package main

import (
	"bufio"
	"embed"
	"fmt"
	"io"
	"net"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"syscall"
	"time"

	"golang.org/x/crypto/ssh"
	"golang.org/x/term"
)

// Embed files into the binary
//
//go:embed capture24-server index.html style.css script.js
var assets embed.FS

// Config struct holds our SSH connection info
type Config struct {
	Host     string
	Username string
	Password string
}

func main() {
	fmt.Println("🚀 Capture24 Launcher")
	fmt.Println("======================")

	// Get SSH connection details
	config := getSSHConfig()

	// Try to connect via SSH
	fmt.Printf("📡 Connecting to %s@%s...\n", config.Username, config.Host)
	client, err := connectSSH(config)
	if err != nil {
		fmt.Printf("❌ Connection failed: %v\n", err)
		return
	}
	defer client.Close() // Close connection when program ends

	fmt.Println("✅ Connected successfully!")

	// Deploy server binary to remote machine
	fmt.Println("📦 Deploying server...")
	err = deployServer(client)
	if err != nil {
		fmt.Printf("❌ Deploy failed: %v\n", err)
		return
	}

	fmt.Println("✅ Server deployed!")

	// Start the remote server
	fmt.Println("🔄 Starting remote server...")
	err = startRemoteServer(client)
	if err != nil {
		fmt.Printf("❌ Failed to start server: %v\n", err)
		return
	}

	// Set up SSH tunnel for port forwarding
	fmt.Println("🔗 Setting up port forwarding...")
	go setupPortForward(client)

	// Wait a moment for tunnel to establish then open browser
	time.Sleep(3 * time.Second)
	openBrowser("http://localhost:8080")

	fmt.Println("✅ Ready! Your browser should open automatically.")
	fmt.Println("If not, go to: http://localhost:8080")
	fmt.Println("Press Ctrl+C to stop")

	// Keep program running
	select {}
}

// getSSHConfig asks user for connection details
func getSSHConfig() Config {
	reader := bufio.NewReader(os.Stdin)

	fmt.Print("Enter SSH Host: ")
	host, _ := reader.ReadString('\n')
	host = strings.TrimSpace(host)

	fmt.Print("Enter Username: ")
	username, _ := reader.ReadString('\n')
	username = strings.TrimSpace(username)

	fmt.Print("Enter Password: ")
	passwordBytes, _ := term.ReadPassword(int(syscall.Stdin))
	password := string(passwordBytes)
	fmt.Println() // Add newline after hidden input

	return Config{
		Host:     host,
		Username: username,
		Password: password,
	}
}

// connectSSH creates an SSH connection using the provided config
func connectSSH(config Config) (*ssh.Client, error) {
	// Create SSH client configuration
	sshConfig := &ssh.ClientConfig{
		User: config.Username,
		Auth: []ssh.AuthMethod{
			ssh.Password(config.Password),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         30 * time.Second,
	}

	// Connect to the SSH server
	return ssh.Dial("tcp", config.Host+":22", sshConfig)
}

// deployServer uploads the embedded server binary to the remote machine
func deployServer(client *ssh.Client) error {
	// Check if server already exists
	session, err := client.NewSession()
	if err != nil {
		return err
	}
	defer session.Close()

	output, err := session.Output("test -f ~/capture24-server && echo 'exists' || echo 'missing'")
	if err != nil {
		return err
	}

	if strings.TrimSpace(string(output)) == "exists" {
		fmt.Println("   Server binary already exists, skipping upload")
		return nil
	}

	// Read embedded server binary
	serverData, err := assets.ReadFile("capture24-server")
	if err != nil {
		return fmt.Errorf("failed to read embedded server: %v", err)
	}

	// Create new session for upload
	session2, err := client.NewSession()
	if err != nil {
		return err
	}
	defer session2.Close()

	// Upload via stdin (simple approach)
	session2.Stdin = strings.NewReader(string(serverData))
	return session2.Run("cat > ~/capture24-server && chmod +x ~/capture24-server")
}

// startRemoteServer starts the capture24-server on the remote machine
func startRemoteServer(client *ssh.Client) error {
	session, err := client.NewSession()
	if err != nil {
		return err
	}
	defer session.Close()

	// Start server in background (nohup keeps it running after SSH disconnects)
	return session.Run("cd ~ && nohup ./capture24-server > /dev/null 2>&1 &")
}

// setupPortForward creates SSH tunnel: localhost:8080 -> remote:3001
func setupPortForward(client *ssh.Client) {
	// Listen on local port 8080
	localListener, err := net.Listen("tcp", "localhost:8080")
	if err != nil {
		fmt.Printf("❌ Failed to listen on localhost:8080: %v\n", err)
		return
	}
	defer localListener.Close()

	fmt.Println("   Port forwarding: localhost:8080 -> remote:3001")

	for {
		// Accept connection from browser
		localConn, err := localListener.Accept()
		if err != nil {
			continue
		}

		// Handle each connection in background
		go handlePortForward(client, localConn)
	}
}

// handlePortForward forwards a single connection from local to remote
func handlePortForward(client *ssh.Client, localConn net.Conn) {
	defer localConn.Close()

	// Connect to remote server (localhost:3001 from server's perspective)
	remoteConn, err := client.Dial("tcp", "localhost:3001")
	if err != nil {
		return
	}
	defer remoteConn.Close()

	// Copy data bidirectionally (browser <-> remote server)
	go io.Copy(remoteConn, localConn) // browser -> remote
	io.Copy(localConn, remoteConn)    // remote -> browser
}

// openBrowser opens the default browser to the given URL
func openBrowser(url string) {
	var err error
	switch runtime.GOOS {
	case "linux":
		err = exec.Command("xdg-open", url).Start()
	case "windows":
		err = exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
	case "darwin":
		err = exec.Command("open", url).Start()
	}
	if err != nil {
		fmt.Printf("Please open your browser to: %s\n", url)
	}
}
