const crypto = require('crypto');

class Block {
    constructor(index, timestamp, transactions, previousHash = '') {
        this.index = index;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.nonce = 0;
        this.hash = this.calculateHash();
    }

    calculateHash() {
        try {
            return crypto
                .createHash('sha256')
                .update(
                    this.index +
                    this.previousHash +
                    this.timestamp +
                    JSON.stringify(this.transactions) +
                    this.nonce
                )
                .digest('hex');
        } catch (error) {
            console.error('Error calculating hash:', error);
            throw new Error('Failed to calculate block hash');
        }
    }

    mineBlock(difficulty) {
        try {
            while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
                this.nonce++;
                this.hash = this.calculateHash();
            }
            console.log("Block mined:", this.hash);
        } catch (error) {
            console.error('Error mining block:', error);
            throw new Error('Failed to mine block');
        }
    }

    hasValidTransactions() {
        for (const tx of this.transactions) {
            if (!tx.isValid()) {
                return false;
            }
        }
        return true;
    }

    isValid() {
        if (!this.hash) {
            console.error('Block has no hash');
            return false;
        }

        if (!this.previousHash) {
            console.error('Block has no previous hash');
            return false;
        }

        if (this.calculateHash() !== this.hash) {
            console.error('Block hash is invalid');
            return false;
        }

        return true;
    }
}

module.exports = Block;
