import * as AuthManager from './auth.ts';

async function processHuggingFaceRedirect() {
    const statusText = document.getElementById('statusText');
    if (!statusText) return;

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
        try {
            statusText.textContent = "Linking account...";
            AuthManager.initAuth();
            const token = await AuthManager.getAuthToken();
            
            if (!token) {
                statusText.textContent = "Please log in to neufangled.com first by cliking Bind robot in LAN mode";
                statusText.style.color = "#dc2626"; // Red
                return;
            }

            const response = await fetch('/huggingface/exchange_code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ code: code })
            });

            if (response.ok) {
                statusText.textContent = "Account linked successfully!";
                statusText.style.color = "#16a34a"; // Green
                // Automatically redirect them back to the control panel
                setTimeout(() => { window.location.href = '/playroom'; }, 2000);
            } else {
                statusText.textContent = "Exchange failed. Please try again.";
                statusText.style.color = "#dc2626"; // Red
                console.error("Exchange failed", await response.text());
            }
        } catch (error) {
            statusText.textContent = "An error occurred.";
            statusText.style.color = "#dc2626"; // Red
            console.error("Error during token exchange:", error);
        }
    } else {
        statusText.textContent = "No authorization code found in URL.";
        statusText.style.color = "#dc2626"; // Red
    }
}

// Execute the flow immediately when the module loads
processHuggingFaceRedirect();