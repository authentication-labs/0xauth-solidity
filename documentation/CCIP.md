# CCIP

### Setup

- Contracts Needed :
  - Sender
  - Reciever
  - CCIPLocalSimulator

### Guides

- https://github.com/smartcontractkit/ccip-starter-kit-hardhat
- https://youtu.be/aLjVF-etcOw?si=67hmibWhG7D_VejI
- https://www.youtube.com/live/_znlltND0xY?si=4jY0l0LFSZ7Blpyd
- https://ccip.chain.link/msg/0x75356f79830f5618e8f0b74df85b22fcca05d120ab9992d73ef2c3a1b3523156
- https://github.com/smartcontractkit/chainlink-local/tree/main
- https://docs.chain.link/ccip/tutorials/send-arbitrary-data-receipt-acknowledgment

### Test CCIP for 0xAuth

- idFactory, Implementation contract address should be same on all chains
- `npx hardhat test test/0xAuth/simple-bridge-fork.test.ts`
