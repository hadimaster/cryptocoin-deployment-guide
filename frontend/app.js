// Wallet Management
class WalletManager {
    constructor() {
        this.apiUrl = 'http://localhost:8000/api';
        this.currentWallet = null;
    }

    async createWallet() {
        try {
            const response = await fetch(`${this.apiUrl}/wallet/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            if (data.success) {
                this.currentWallet = data.wallet;
                this.updateWalletUI();
                return data.wallet;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error creating wallet:', error);
            this.showError('Failed to create wallet');
        }
    }

    async getBalance(address) {
        try {
            const response = await fetch(`${this.apiUrl}/wallet/${address}/balance`);
            const data = await response.json();
            if (data.success) {
                return data.balance;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error getting balance:', error);
            this.showError('Failed to get wallet balance');
        }
    }

    updateWalletUI() {
        const connectWalletBtn = document.getElementById('connectWalletBtn');
        const walletSection = document.getElementById('walletSection');
        const walletAddress = document.getElementById('walletAddress');
        const walletBalance = document.getElementById('walletBalance');

        if (this.currentWallet) {
            connectWalletBtn.textContent = 'Wallet Connected';
            connectWalletBtn.classList.remove('bg-indigo-600');
            connectWalletBtn.classList.add('bg-green-600');
            
            walletSection.classList.remove('hidden');
            walletAddress.textContent = `${this.currentWallet.address.substring(0, 6)}...${this.currentWallet.address.substring(this.currentWallet.address.length - 4)}`;
            
            this.getBalance(this.currentWallet.address).then(balance => {
                walletBalance.textContent = `${balance} CC`;
            });
        }
    }

    showError(message) {
        alert(message);
    }

    showSuccess(message) {
        alert(message);
    }

    async sendTransaction(toAddress, amount) {
        try {
            if (!this.currentWallet) {
                throw new Error('No wallet connected');
            }

            const response = await fetch(`${this.apiUrl}/transaction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fromAddress: this.currentWallet.address,
                    toAddress,
                    amount: parseFloat(amount),
                    privateKey: this.currentWallet.privateKey
                })
            });

            const data = await response.json();
            if (data.success) {
                this.showSuccess('Transaction sent successfully');
                this.updateWalletUI(); // Update balance after transaction
                return data.transaction;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error sending transaction:', error);
            this.showError('Failed to send transaction');
        }
    }
}

// Blockchain Explorer
class BlockchainExplorer {
    constructor() {
        this.apiUrl = 'http://localhost:8000/api';
    }

    async getBlockchainInfo() {
        try {
            const response = await fetch(`${this.apiUrl}/blockchain`);
            const data = await response.json();
            if (data.success) {
                return data;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error getting blockchain info:', error);
            throw error;
        }
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    const walletManager = new WalletManager();
    const explorer = new BlockchainExplorer();

    // Connect wallet button
    const connectWalletBtn = document.getElementById('connectWalletBtn');
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', async () => {
            if (!walletManager.currentWallet) {
                await walletManager.createWallet();
            }
        });
    }

    // Send transaction form
    const sendForm = document.getElementById('sendForm');
    if (sendForm) {
        sendForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const toAddress = document.getElementById('toAddress').value;
            const amount = document.getElementById('amount').value;
            
            if (!toAddress || !amount) {
                walletManager.showError('Please fill in all fields');
                return;
            }

            await walletManager.sendTransaction(toAddress, amount);
            sendForm.reset();
        });
    }

    // Update blockchain info
    const updateBlockchainInfo = async () => {
        try {
            const info = await explorer.getBlockchainInfo();
            // Update UI with blockchain info
            const chainLength = document.getElementById('chainLength');
            if (chainLength) {
                chainLength.textContent = info.chainLength;
            }
        } catch (error) {
            console.error('Error updating blockchain info:', error);
        }
    };

    // Update blockchain info every 30 seconds
    updateBlockchainInfo();
    setInterval(updateBlockchainInfo, 30000);
});
