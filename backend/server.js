const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const Blockchain = require('./blockchain/blockchain');
const Transaction = require('./blockchain/transaction');
const Wallet = require('./wallet/wallet');

const app = express();
const port = 8000;

// Initialize blockchain
const cryptoCoin = new Blockchain();
const wallets = new Map();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Error handler middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: err.message
    });
});

// Static file serving
const staticPath = path.join(__dirname, '../frontend');
console.log('Serving static files from:', staticPath);
app.use(express.static(staticPath));

// API Routes
app.get('/api/blockchain', (req, res) => {
    try {
        const chainData = {
            chain: cryptoCoin.chain,
            pendingTransactions: cryptoCoin.pendingTransactions,
            chainLength: cryptoCoin.getChainLength(),
            difficulty: cryptoCoin.difficulty,
            miningReward: cryptoCoin.miningReward
        };
        res.json({ success: true, ...chainData });
    } catch (error) {
        console.error('Error getting blockchain info:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/wallet/create', (req, res) => {
    try {
        const wallet = new Wallet();
        const keyPair = wallet.generateKeyPair();
        wallets.set(keyPair.publicKey, wallet);
        res.json({
            success: true,
            wallet: {
                address: keyPair.publicKey,
                privateKey: keyPair.privateKey
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating wallet',
            error: error.message
        });
    }
});

app.get('/api/wallet/:address/balance', (req, res) => {
    try {
        const { address } = req.params;
        const balance = cryptoCoin.getBalanceOfAddress(address);
        res.json({
            success: true,
            address,
            balance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting wallet balance',
            error: error.message
        });
    }
});

app.post('/api/transaction', (req, res) => {
    try {
        const { fromAddress, toAddress, amount, privateKey } = req.body;
        if (!fromAddress || !toAddress || !amount || !privateKey) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const wallet = wallets.get(fromAddress);
        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: 'Wallet not found'
            });
        }

        const transaction = wallet.createTransaction(toAddress, amount, cryptoCoin);
        cryptoCoin.addTransaction(transaction);

        res.json({
            success: true,
            transaction: transaction.toJSON(),
            pendingTransactions: cryptoCoin.pendingTransactions.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating transaction',
            error: error.message
        });
    }
});

app.post('/api/mine', (req, res) => {
    try {
        const { minerAddress } = req.body;
        if (!minerAddress) {
            return res.status(400).json({
                success: false,
                message: 'Miner address is required'
            });
        }

        const block = cryptoCoin.minePendingTransactions(minerAddress);
        res.json({
            success: true,
            message: 'Block mined successfully',
            block: block,
            balance: cryptoCoin.getBalanceOfAddress(minerAddress)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error mining block',
            error: error.message
        });
    }
});

// Catch-all route to serve index.html for SPA
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(staticPath, 'index.html'));
    }
});

// Error handler middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: err.message
    });
});

// Routes

// Get blockchain info
app.get('/api/blockchain', (req, res) => {
    try {
        res.json({
            success: true,
            chain: cryptoCoin.toJSON(),
            pendingTransactions: cryptoCoin.pendingTransactions,
            chainLength: cryptoCoin.getChainLength()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting blockchain info',
            error: error.message
        });
    }
});

// Create new wallet
app.post('/api/wallet/create', (req, res) => {
    try {
        const wallet = new Wallet();
        const keyPair = wallet.generateKeyPair();
        wallets.set(keyPair.publicKey, wallet);

        res.json({
            success: true,
            wallet: {
                address: keyPair.publicKey,
                privateKey: keyPair.privateKey
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating wallet',
            error: error.message
        });
    }
});

// Import existing wallet
app.post('/api/wallet/import', (req, res) => {
    try {
        const { privateKey } = req.body;
        if (!privateKey) {
            return res.status(400).json({
                success: false,
                message: 'Private key is required'
            });
        }

        const wallet = new Wallet();
        const keyPair = wallet.importWallet(privateKey);
        wallets.set(keyPair.publicKey, wallet);

        res.json({
            success: true,
            wallet: {
                address: keyPair.publicKey,
                balance: cryptoCoin.getBalanceOfAddress(keyPair.publicKey)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error importing wallet',
            error: error.message
        });
    }
});

// Get wallet balance
app.get('/api/wallet/:address/balance', (req, res) => {
    try {
        const { address } = req.params;
        const balance = cryptoCoin.getBalanceOfAddress(address);

        res.json({
            success: true,
            address,
            balance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting wallet balance',
            error: error.message
        });
    }
});

// Create new transaction
app.post('/api/transaction', (req, res) => {
    try {
        const { fromAddress, toAddress, amount, privateKey } = req.body;

        // Validate inputs
        if (!fromAddress || !toAddress || !amount || !privateKey) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Get wallet
        const wallet = wallets.get(fromAddress);
        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: 'Wallet not found'
            });
        }

        // Create and sign transaction
        const transaction = wallet.createTransaction(toAddress, amount, cryptoCoin);
        cryptoCoin.addTransaction(transaction);

        res.json({
            success: true,
            transaction: transaction.toJSON(),
            pendingTransactions: cryptoCoin.pendingTransactions.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating transaction',
            error: error.message
        });
    }
});

// Mine pending transactions
app.post('/api/mine', (req, res) => {
    try {
        const { minerAddress } = req.body;
        if (!minerAddress) {
            return res.status(400).json({
                success: false,
                message: 'Miner address is required'
            });
        }

        const block = cryptoCoin.minePendingTransactions(minerAddress);

        res.json({
            success: true,
            message: 'Block mined successfully',
            block: block,
            balance: cryptoCoin.getBalanceOfAddress(minerAddress)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error mining block',
            error: error.message
        });
    }
});

// Get transaction history for an address
app.get('/api/transactions/:address', (req, res) => {
    try {
        const { address } = req.params;
        const transactions = cryptoCoin.getAllTransactionsForAddress(address);

        res.json({
            success: true,
            address,
            transactions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting transaction history',
            error: error.message
        });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Cryptocurrency server running on port ${port}`);
});
