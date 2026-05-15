import hashlib
import json
import time
import os

class Block:
    def __init__(self, index, transactions, timestamp, previous_hash, nonce=0):
        self.index = index
        self.transactions = transactions
        self.timestamp = timestamp
        self.previous_hash = previous_hash
        self.nonce = nonce
        self.hash = self.compute_hash()

    def compute_hash(self):
        block_string = json.dumps(self.__dict__, sort_keys=True)
        return hashlib.sha256(block_string.encode()).hexdigest()

class Blockchain:
    # Độ khó đào block (Proof of Work)
    difficulty = 2

    def __init__(self):
        self.unconfirmed_transactions = []
        self.chain = []
        self.load_chain()

    def create_genesis_block(self):
        genesis_block = Block(0, [], time.time(), "0")
        genesis_block.hash = genesis_block.compute_hash()
        self.chain.append(genesis_block)

    @property
    def last_block(self):
        return self.chain[-1]

    def add_block(self, block, proof):
        previous_hash = self.last_block.hash
        if previous_hash != block.previous_hash:
            return False
        if not self.is_valid_proof(block, proof):
            return False
        block.hash = proof
        self.chain.append(block)
        return True

    def is_valid_proof(self, block, block_hash):
        return (block_hash.startswith('0' * Blockchain.difficulty) and
                block_hash == block.compute_hash())

    def proof_of_work(self, block):
        block.nonce = 0
        computed_hash = block.compute_hash()
        while not computed_hash.startswith('0' * Blockchain.difficulty):
            block.nonce += 1
            computed_hash = block.compute_hash()
        return computed_hash

    def add_new_transaction(self, transaction):
        self.unconfirmed_transactions.append(transaction)

    def mine(self):
        if not self.unconfirmed_transactions:
            return False

        last_block = self.last_block
        new_block = Block(index=last_block.index + 1,
                          transactions=self.unconfirmed_transactions,
                          timestamp=time.time(),
                          previous_hash=last_block.hash)

        proof = self.proof_of_work(new_block)
        self.add_block(new_block, proof)
        self.unconfirmed_transactions = []
        self.save_chain()
        return new_block.index

    def save_chain(self):
        chain_data = []
        for block in self.chain:
            chain_data.append(block.__dict__)
        with open('blockchain.json', 'w', encoding='utf-8') as f:
            json.dump(chain_data, f, indent=4, ensure_ascii=False)

    def load_chain(self):
        if os.path.exists('blockchain.json'):
            try:
                with open('blockchain.json', 'r', encoding='utf-8') as f:
                    chain_data = json.load(f)
                    for block_data in chain_data:
                        block = Block(block_data['index'],
                                      block_data['transactions'],
                                      block_data['timestamp'],
                                      block_data['previous_hash'],
                                      block_data['nonce'])
                        block.hash = block_data['hash']
                        self.chain.append(block)
            except:
                self.create_genesis_block()
        else:
            self.create_genesis_block()

    def check_chain_validity(self):
        for i in range(1, len(self.chain)):
            current = self.chain[i]
            previous = self.chain[i-1]
            if current.hash != current.compute_hash():
                return False
            if current.previous_hash != previous.hash:
                return False
        return True
