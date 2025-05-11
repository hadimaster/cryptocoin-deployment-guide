const Block = require('./block');
const Transaction = require('./transaction');

class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 4; // Adjust mining difficulty
        this.pendingTransactions = [];
        this.miningReward = 100; // Mining reward in cryptocurrency units
    }

    createGenesisBlock() {
        try {
            return new Block(0, Date.now(), [], "0");
        } catch (error) {
            console.error('Error creating genesis block:', error);
            throw new Error('Failed to create genesis block');
        }
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    minePendingTransactions(miningRewardAddress) {
        try {
            // Create mining reward transaction
            const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
            this.pendingTransactions.push(rewardTx);

            // Create new block and mine it
            const block = new Block(
                this.chain.length,
                Date.now(),
                this.pendingTransactions,
                this.getLatestBlock().hash
            );

            block.mineBlock(this.difficulty);

            // Add block to chain and clear pending transactions
            console.log('Block successfully mined!');
            this.chain.push(block);
            this.pendingTransactions = [];

            return block;
        } catch (error) {
            console.error('Error mining pending transactions:', error);
            throw new Error('Failed to mine pending transactions');
        }
    }

    addTransaction(transaction) {
        try {
            // Verify transaction fields
            if (!transaction.fromAddress || !transaction.toAddress) {
                throw new Error('Transaction must include from and to address');
            }

            // Verify transaction is valid
            if (!transaction.isValid()) {
                throw new Error('Cannot add invalid transaction to chain');
            }

            // Verify sender has enough balance
            if (this.getBalanceOfAddress(transaction.fromAddress) < transaction.amount) {
                throw new Error('Not enough balance');
            }

            this.pendingTransactions.push(transaction);
            console.log('Transaction added to pending transactions');
            
            return true;
        } catch (error) {
            console.error('Error adding transaction:', error);
            throw new Error('Failed to add transaction');
        }
    }

    getBalanceOfAddress(address) {
        try {
            let balance = 0;

            // Look through all blocks
            for (const block of this.chain) {
                for (const trans of block.transactions) {
                    // If address is sender, subtract amount
                    if (trans.fromAddress === address) {
                        balance -= trans.amount;
                    }

                    // If address is recipient, add amount
                    if (trans.toAddress === address) {
                        balance += trans.amount;
                    }
                }
            }

            return balance;
        } catch (error) {
            console.error('Error calculating balance:', error);
            throw new Error('Failed to calculate balance');
        }
    }

    getAllTransactionsForAddress(address) {
        try {
            const transactions = [];

            // Look through all blocks
            for (const block of this.chain) {
                for (const trans of block.transactions) {
                    if (trans.fromAddress === address || trans.toAddress === address) {
                        transactions.push(trans);
                    }
                }
            }

            return transactions;
        } catch (error) {
            console.error('Error getting transactions:', error);
            throw new Error('Failed to get transactions');
        }
    }

    isChainValid() {
        try {
            // Check if genesis block is valid
            const realGenesis = JSON.stringify(this.createGenesisBlock());
            if (realGenesis !== JSON.stringify(this.chain[0])) {
                return false;
            }

            // Check all blocks in chain
            for (let i = 1; i < this.chain.length; i++) {
                const currentBlock = this.chain[i];
                const previousBlock = this.chain[i - 1];

                // Verify block's transactions are valid
                if (!currentBlock.hasValidTransactions()) {
                    console.error('Invalid transactions in block');
                    return false;
                }

                // Verify block's hash is valid
                if (currentBlock.hash !== currentBlock.calculateHash()) {
                    console.error('Invalid hash in block');
                    return false;
                }

                // Verify block points to previous block
                if (currentBlock.previousHash !== previousBlock.hash) {
                    console.error('Invalid previous hash in block');
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.error('Error validating chain:', error);
            return false;
        }
    }

    getChainLength() {
        return this.chain.length;
    }

    toJSON() {
        return {
            chain: this.chain,
            difficulty: this.difficulty,
            pendingTransactions: this.pendingTransactions,
            miningReward: this.miningReward
        };
    }
}

module.exports = Blockchain;
