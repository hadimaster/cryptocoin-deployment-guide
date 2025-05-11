const crypto = require('crypto');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1'); // Same curve used by Bitcoin

class Transaction {
    constructor(fromAddress, toAddress, amount) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.timestamp = Date.now();
        this.signature = '';
    }

    calculateHash() {
        try {
            return crypto
                .createHash('sha256')
                .update(this.fromAddress + this.toAddress + this.amount + this.timestamp)
                .digest('hex');
        } catch (error) {
            console.error('Error calculating transaction hash:', error);
            throw new Error('Failed to calculate transaction hash');
        }
    }

    signTransaction(signingKey) {
        try {
            // Verify the signing key is for the from address
            if (signingKey.getPublic('hex') !== this.fromAddress) {
                throw new Error('You cannot sign transactions for other wallets!');
            }

            // Calculate transaction hash and sign it
            const hashTx = this.calculateHash();
            const sig = signingKey.sign(hashTx, 'base64');
            this.signature = sig.toDER('hex');
        } catch (error) {
            console.error('Error signing transaction:', error);
            throw new Error('Failed to sign transaction');
        }
    }

    isValid() {
        try {
            // Mining reward transaction
            if (this.fromAddress === null) {
                return true;
            }

            // Check if signature exists
            if (!this.signature || this.signature.length === 0) {
                throw new Error('No signature in this transaction');
            }

            // Verify the transaction
            const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
            return publicKey.verify(this.calculateHash(), this.signature);
        } catch (error) {
            console.error('Error validating transaction:', error);
            return false;
        }
    }

    toJSON() {
        return {
            fromAddress: this.fromAddress,
            toAddress: this.toAddress,
            amount: this.amount,
            timestamp: this.timestamp,
            signature: this.signature
        };
    }
}

module.exports = Transaction;
