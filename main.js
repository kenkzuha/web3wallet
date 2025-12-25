let provider;
let signer;
let userAddress;

const connectBtn = document.getElementById('connectBtn');
const walletInfo = document.getElementById('walletInfo');
const walletAddress = document.getElementById('walletAddress');
const balance = document.getElementById('balance');
const network = document.getElementById('network');
const sendBtn = document.getElementById('sendBtn');
const refreshBtn = document.getElementById('refreshBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const sendForm = document.getElementById('sendForm');
const confirmSendBtn = document.getElementById('confirmSendBtn');
const cancelSendBtn = document.getElementById('cancelSendBtn');
const statusDiv = document.getElementById('status');

function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status active ${type}`;

    setTimeout(() => {
        statusDiv.className = 'status';
    }, 5000);
}

function formatAddress(address) {
    return address.substring(0, 6) + '...' + address.substring(38);
}

async function connectWallet() {
    try {
        if (typeof window.ethereum === 'undefined') {
            showStatus(
                'Please install Trust Wallet or MetaMask browser extension, ' +
                'or open this page in Trust Wallet browser',
                'error'
            );
            return;
        }
        showStatus('Connecting to wallet...', 'info');
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        userAddress = accounts[0];
        walletAddress.textContent = formatAddress(userAddress);
        await updateBalance();
        const networkInfo = await provider.getNetwork();
        const networkName = networkInfo.name.charAt(0).toUpperCase() +
            networkInfo.name.slice(1);
        network.textContent = networkName;
        connectBtn.style.display = 'none';
        walletInfo.classList.add('active');
        showStatus('Wallet connected successfully!', 'success');
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
    } catch (error) {
        console.error('Error connecting wallet:', error);
        showStatus('Failed to connect wallet: ' + error.message, 'error');
    }
}
async function updateBalance() {
    try {
        const balanceWei = await provider.getBalance(userAddress);
        const balanceEth = ethers.utils.formatEther(balanceWei);
        balance.textContent = parseFloat(balanceEth).toFixed(4) + ' ETH';
    } catch (error) {
        console.error('Error fetching balance:', error);
        showStatus('Failed to fetch balance', 'error');
    }
}

function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        disconnectWallet();
    } else {
        userAddress = accounts[0];
        walletAddress.textContent = formatAddress(userAddress);
        updateBalance();
    }
}

function handleChainChanged() {
    window.location.reload();
}

function disconnectWallet() {
    provider = null;
    signer = null;
    userAddress = null;
    connectBtn.style.display = 'block';
    walletInfo.classList.remove('active');
    sendForm.classList.remove('active');

    showStatus('Wallet disconnected', 'info');
}

async function sendTransaction() {
    const recipient = document.getElementById('recipientAddress').value;
    const amount = document.getElementById('amount').value;

    if (!recipient || !amount) {
        showStatus('Please fill in all fields', 'error');
        return;
    }

    if (!ethers.utils.isAddress(recipient)) {
        showStatus('Invalid recipient address', 'error');
        return;
    }

    try {
        showStatus('Sending transaction...', 'info');

        const tx = await signer.sendTransaction({
            to: recipient,
            value: ethers.utils.parseEther(amount)
        });

        showStatus(
            'Transaction submitted! Waiting for confirmation...',
            'info'
        );

        await tx.wait();

        showStatus(
            'Transaction confirmed! Hash: ' +
            tx.hash.substring(0, 10) + '...',
            'success'
        );

        document.getElementById('recipientAddress').value = '';
        document.getElementById('amount').value = '';
        sendForm.classList.remove('active');

        await updateBalance();

    } catch (error) {
        console.error('Transaction error:', error);
        showStatus('Transaction failed: ' + error.message, 'error');
    }
}

function showSendForm() {
    sendForm.classList.add('active');
}

function hideSendForm() {
    sendForm.classList.remove('active');
    document.getElementById('recipientAddress').value = '';
    document.getElementById('amount').value = '';
}

connectBtn.addEventListener('click', connectWallet);
disconnectBtn.addEventListener('click', disconnectWallet);
refreshBtn.addEventListener('click', updateBalance);
sendBtn.addEventListener('click', showSendForm);
cancelSendBtn.addEventListener('click', hideSendForm);
confirmSendBtn.addEventListener('click', sendTransaction);