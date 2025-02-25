        // DOM Elements
        const startButton = document.getElementById('startButton');
        const stopButton = document.getElementById('stopButton');
        const switchCameraButton = document.getElementById('switchCameraButton');
        const resultContainer = document.getElementById('resultContainer');
        const resultText = document.getElementById('resultText');
        const copyButton = document.getElementById('copyButton');
        const openLinkButton = document.getElementById('openLinkButton');
        const errorContainer = document.getElementById('errorContainer');
        const errorMessage = document.getElementById('errorMessage');
        const video = document.getElementById('video');
        const canvas = document.getElementById('canvas');
        const fileInput = document.getElementById('fileInput');

        // Variables
        let stream = null;
        let canvasContext = canvas.getContext('2d', { willReadFrequently: true });
        let scanningActive = false;
        let currentCamera = 'environment';
        let scanResult = '';
        let availableCameras = [];
        let currentCameraIndex = 0;

        // Initialize the application
        function init() {
            // Set up event listeners
            startButton.addEventListener('click', startScanner);
            stopButton.addEventListener('click', stopScanner);
            switchCameraButton.addEventListener('click', switchCamera);
            copyButton.addEventListener('click', copyToClipboard);
            openLinkButton.addEventListener('click', openLink);
            fileInput.addEventListener('change', handleFileSelect);

            // Check for camera support
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                showError('Your browser does not support camera access. Please try using image upload or update your browser.');
                disableCameraButtons();
            } else {
                // List available cameras
                navigator.mediaDevices.enumerateDevices()
                    .then(devices => {
                        const videoDevices = devices.filter(device => device.kind === 'videoinput');
                        availableCameras = videoDevices;
                        switchCameraButton.disabled = videoDevices.length <= 1;
                    })
                    .catch(err => {
                        console.warn('Could not enumerate devices', err);
                    });
            }
        }

        // Start scanner
        function startScanner() {
            resultContainer.style.display = 'none';
            errorContainer.style.display = 'none';
            startButton.classList.remove('pulse');
            
            // Check if HTTPS or localhost
            const isSecureContext = window.location.protocol === 'https:' || 
                                    window.location.hostname === 'localhost' || 
                                    window.location.hostname === '127.0.0.1';
            
            if (!isSecureContext) {
                showError('Camera access requires HTTPS. Please use a secure connection or try scanning from an image instead.');
                return;
            }

            const constraints = {
                video: { 
                    facingMode: currentCamera,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            navigator.mediaDevices.getUserMedia(constraints)
                .then(videoStream => {
                    stream = videoStream;
                    video.srcObject = stream;
                    video.play();
                    scanningActive = true;
                    updateButtons(true);
                    
                    // Start scanning for QR codes
                    requestAnimationFrame(scanQRCode);
                })
                .catch(err => {
                    console.error('Scanner start error:', err);
                    let errorMsg = 'Failed to start camera.';
                    
                    if (err.name === 'NotAllowedError') {
                        errorMsg = 'Camera access denied. Please allow camera permissions in your browser.';
                    } else if (err.name === 'NotFoundError') {
                        errorMsg = 'No camera found. Please connect a camera or try scanning from an image.';
                    } else if (err.message && err.message.includes('HTTPS')) {
                        errorMsg = 'Camera access requires a secure connection (HTTPS). Try scanning from an image instead.';
                    }
                    
                    showError(errorMsg);
                });
        }

        // Scan QR code from video stream
        function scanQRCode() {
            if (!scanningActive) return;
            
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                // Resize canvas to match video dimensions
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                
                // Draw current video frame to canvas
                canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // Get image data from canvas
                const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
                
                // Scan for QR code using jsQR
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });
                
                if (code) {
                    // QR code found
                    scanResult = code.data;
                    showResult(scanResult);
                    stopScanner();
                    return;
                }
            }
            
            // Continue scanning
            requestAnimationFrame(scanQRCode);
        }

        // Stop scanner
        function stopScanner() {
            scanningActive = false;
            
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
                video.srcObject = null;
            }
            
            updateButtons(false);
        }

        // Switch camera
        function switchCamera() {
            if (availableCameras.length <= 1) return;
            
            stopScanner();
            
            // Switch camera mode
            currentCamera = currentCamera === 'environment' ? 'user' : 'environment';
            
            // Try with next camera
            currentCameraIndex = (currentCameraIndex + 1) % availableCameras.length;
            
            setTimeout(startScanner, 300); // Small delay to ensure camera is fully stopped
        }

        // Show scan result
        function showResult(text) {
            resultText.textContent = text;
            resultContainer.style.display = 'block';
            
            // Enable/disable open link button based on result
            const isUrl = text.startsWith('http://') || text.startsWith('https://') || text.startsWith('www.');
            openLinkButton.style.display = isUrl ? 'block' : 'none';
        }

        // Show error message
        function showError(message) {
            errorMessage.textContent = message;
            errorContainer.style.display = 'block';
            updateButtons(false);
        }

        // Disable camera buttons
        function disableCameraButtons() {
            startButton.disabled = true;
            stopButton.disabled = true;
            switchCameraButton.disabled = true;
        }

        // Copy result to clipboard
        function copyToClipboard() {
            navigator.clipboard.writeText(scanResult)
                .then(() => {
                    const originalText = copyButton.textContent;
                    copyButton.textContent = 'Copied!';
                    copyButton.classList.add('success');
                    
                    setTimeout(() => {
                        copyButton.textContent = originalText;
                        copyButton.classList.remove('success');
                    }, 2000);
                })
                .catch(err => {
                    console.error('Copy failed:', err);
                });
        }

        // Open URL
        function openLink() {
            let url = scanResult;
            if (url.startsWith('www.')) {
                url = 'https://' + url;
            }
            window.open(url, '_blank');
        }

        // Update button states
        function updateButtons(isScanning) {
            startButton.disabled = isScanning;
            stopButton.disabled = !isScanning;
            switchCameraButton.disabled = !isScanning || availableCameras.length <= 1;
        }

        // Handle file select for QR code scanning from image
        function handleFileSelect(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            resultContainer.style.display = 'none';
            
            const img = new Image();
            const reader = new FileReader();
            
            reader.onload = function(e) {
                img.onload = function() {
                    // Draw image to canvas
                    canvas.width = img.width;
                    canvas.height = img.height;
                    canvasContext.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    // Get image data from canvas
                    const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
                    
                    // Scan for QR code using jsQR
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: "dontInvert",
                    });
                    
                    if (code) {
                        // QR code found
                        scanResult = code.data;
                        showResult(scanResult);
                    } else {
                        showError('No QR code found in the image. Please try a different image or use the camera scanner.');
                    }
                };
                
                img.src = e.target.result;
            };
            
            reader.readAsDataURL(file);
            
            // Reset file input so the same file can be selected again
            fileInput.value = '';
        }

        // Initialize when DOM is loaded
        document.addEventListener('DOMContentLoaded', init);