const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const crypto = require('crypto');
const Transaction = require('../blockchain/transaction');

class Wallet {
    constructor() {
        this.keyPair = null;
        this.publicKey = null;
        this.privateKey = null;
    }

    generateKeyPair() {
        try {
            // Generate new key pair
            this.keyPair = ec.genKeyPair();
            
            // Get public and private key
            this.privateKey = this.keyPair.getPrivate('hex');
            this.publicKey = this.keyPair.getPublic('hex');

            return {
                publicKey: this.publicKey,
                privateKey: this.privateKey
            };
        } catch (error) {
            console.error('Error generating key pair:', error);
            throw new Error('Failed to generate wallet key pair');
        }
    }

    importWallet(privateKey) {
        try {
            // Import existing wallet from private key
            this.keyPair = ec.keyFromPrivate(privateKey);
            this.privateKey = privateKey;
            this.publicKey = this.keyPair.getPublic('hex');

            return {
                publicKey: this.publicKey,
                privateKey: this.privateKey
            };
        } catch (error) {
            console.error('Error importing wallet:', error);
            throw new Error('Failed to import wallet');
        }
    }

    getBalance(blockchain) {
        try {
            return blockchain.getBalanceOfAddress(this.publicKey);
        } catch (error) {
            console.error('Error getting balance:', error);
            throw new Error('Failed to get wallet balance');
        }
    }

    createTransaction(toAddress, amount, blockchain) {
        try {
            // Verify wallet is initialized
            if (!this.keyPair) {
                throw new Error('Wallet not initialized');
            }

            // Check balance
            const balance = this.getBalance(blockchain);
            if (amount > balance) {
                throw new Error('Not enough funds');
            }

            // Create and sign transaction
            const transaction = new Transaction(this.publicKey, toAddress, amount);
            transaction.signTransaction(this.keyPair);

            return transaction;
        } catch (error) {
            console.error('Error creating transaction:', error);
            throw new Error('Failed to create transaction');
        }
    }

    getTransactionHistory(blockchain) {
        try {
            return blockchain.getAllTransactionsForAddress(this.publicKey);
        } catch (error) {
            console.error('Error getting transaction history:', error);
            throw new Error('Failed to get transaction history');
        }
    }

    exportWallet() {
        try {
            if (!this.privateKey) {
                throw new Error('No wallet to export');
            }

            return {
                address: this.publicKey,
                privateKey: this.privateKey
            };
        } catch (error) {
            console.error('Error exporting wallet:', error);
            throw new Error('Failed to export wallet');
        }
    }

    getAddress() {
        if (!this.publicKey) {
            throw new Error('Wallet not initialized');
        }
        return this.publicKey;
    }

    // Generate a random mnemonic phrase for wallet recovery
    static generateMnemonic() {
        try {
            const wordList = [
                "abandon", "ability", "able", "about", "above", "absent",
                "absorb", "abstract", "absurd", "abuse", "access", "accident",
                // ... add more words as needed
            ];
            
            // Generate 12 random words
            const words = [];
            for (let i = 0; i < 12; i++) {
                const randomIndex = crypto.randomInt(0, wordList.length);
                words.push(wordList[randomIndex]);
            }
            
            return words.join(' ');
        } catch (error) {
            console.error('Error generating mnemonic:', error);
            throw new Error('Failed to generate mnemonic phrase');
        }
    }

    toJSON() {
        return {
            address: this.publicKey,
            balance: null // To be filled by the blockchain
        };
    }
}

module.exports = Wallet;
