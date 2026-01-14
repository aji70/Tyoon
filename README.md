
# Tycoon - Blockchain Monopoly on Base and Celo

Welcome to **Tycoon**, a fully on-chain version of the classic Monopoly board game that brings the timeless property trading experience to the blockchain. This project is deployed on the **Base and Celo networks**, combining the strategic depth of traditional Monopoly with blockchain technology's transparency and ownership.

## What is Tycoon?

Tycoon recreates the Monopoly experience where players roll dice, buy properties, collect rent, and compete to bankrupt their opponents. But here's where it gets interesting: everything happens on-chain. Your game stakes, rewards, and collectible perks are all managed through smart contracts deployed on Base and Celo.

Whether you're playing against friends in a private room or challenging AI opponents for practice, every move is verifiable, every payout is automatic, and every reward you earn is genuinely yours.

## The Architecture

This project is split into three main components that work together to deliver a seamless gaming experience:

### Smart Contracts (Solidity on Base and Celo)

The heart of Tycoon lives on the Base and Celo blockchains through two primary smart contracts:

#### 1. Tycoon.sol - The Main Game Engine

This is where all the game logic happens. The contract handles:

- **Player Registration**: When you join Tycoon for the first time, you register with a username and receive a welcome bonus of 2 TYC tokens (the platform's reward token) as vouchers
- **Game Creation**: Start public or private games with 2-8 players, set your own stake amounts (minimum determined by contract), and customize starting balances
- **AI Games**: Practice against AI opponents without risking real stakes
- **Game Flow**: Join games, track player positions, manage in-game balances, and handle player eliminations
- **Rewards Distribution**: When games end, the contract automatically distributes USDC prizes:
  - 50% to 1st place
  - 30% to 2nd place
  - 20% to 3rd place
  - House takes 5% fee
  - Losers get consolation vouchers worth 0.1 TYC

The contract also includes a sophisticated **TycoonRewardSystem** (ERC-1155) that manages:

- **Vouchers**: Redeemable NFTs that you can burn to claim TYC tokens
- **Collectibles**: Burnable in-game power-ups with special perks like:
  - Extra turns
  - Get out of jail free
  - Shields (immunity from rent)
  - Teleportation
  - Property discounts
  - Cash boosts with tiered values (10, 25, 50, 100, 250)
  - Exact dice roll selection

Winners and top players receive random collectible drops based on their performance. The shop system lets players buy collectibles using either TYC tokens or USDC.

#### 2. TycoonNFT.sol - Commemorative NFTs

A straightforward ERC-721 contract for minting commemorative NFTs. Players can receive special NFTs for achievements or milestones. The contract includes:

- Whitelist-based minting
- Custom URI support for unique NFT metadata
- Owner controls for whitelist management

Both contracts leverage OpenZeppelin's battle-tested implementations and include security features like reentrancy protection and pausability.

**Network**: All contracts are deployed on **Base and Celo**, benefiting from low transaction fees and fast confirmations.

### Backend (Node.js + Express + Socket.io)

The backend acts as the game coordinator and real-time communication hub. Built with Express.js, it provides:

- **RESTful API**: Comprehensive endpoints for managing users, games, properties, trades, chat, and more
- **Real-time Gameplay**: Socket.io handles live game updates, ensuring all players see moves, dice rolls, and property changes instantly
- **Database**: Uses Knex.js with MySQL to track game state, player statistics, trade history, and chat messages
- **Game Perks Integration**: Special endpoints for activating collectible perks (teleportation, exact rolls, cash burns)

The server coordinates between the blockchain contracts and the frontend, maintaining a persistent game state while the smart contracts handle the financial transactions and reward distributions.

Key features:
- Rate limiting to prevent abuse
- Security headers via Helmet
- CORS configuration for frontend communication
- Comprehensive error handling
- Health check endpoints for monitoring

### Frontend (Next.js + React + TypeScript)

The frontend delivers a polished, responsive gaming experience built with modern web technologies:

- **Framework**: Next.js 14 with React 18 for server-side rendering and optimal performance
- **Styling**: Tailwind CSS with custom components and Framer Motion for smooth animations
- **Wallet Integration**: 
  - Reown AppKit (formerly WalletConnect) for wallet connections
  - Wagmi and Viem for Web3 interactions
  - Support for all Base and Celo-compatible wallets
- **Real-time Updates**: Socket.io client keeps the game board synchronized across all players
- **UI Components**: 
  - Interactive game board
  - Property cards and trading interfaces
  - Collectibles shop
  - Player dashboards with statistics
  - Mobile-responsive design with dedicated mobile components

The frontend communicates with both the backend API (for game state) and directly with the Base and Celo networks (for transactions and blockchain reads).

## Getting Started

### Prerequisites

Before running Tycoon locally, make sure you have:

- Node.js (v18 or higher)
- MySQL database
- A Base and Celo-compatible wallet (MetaMask, Rainbow, etc.)
- Some Base ETH and Celo for gas fees

### Contract Deployment Info

The contracts are already deployed on Base and Celo:

- **Tycoon Game Contract**: `0xc6c2ccc0cA40d700DE2e5696f2a5e71dd838A1c4`
- **TYC Token (ERC-20)**: `0x8A867F46f1A0e8bA1AF573E83B26F86Aa23e07D3`

You can verify these contracts on [BaseScan](https://basescan.org).

### Setting Up the Backend

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.example.env` with your database credentials and configuration

4. Run database migrations:
```bash
npm run migrate
```

5. (Optional) Seed the database with initial data:
```bash
npm run seed
```

6. Start the development server:
```bash
npm run dev
```

The backend will run on `http://localhost:3000` by default.

### Setting Up the Frontend

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with required environment variables:
   - API URL pointing to your backend
   - Reown/WalletConnect project ID
   - Base and Celo network RPC URLs

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000` (or the next available port).

### Compiling Smart Contracts

The contracts use Foundry for development and testing:

1. Navigate to the contract directory:
```bash
cd contract
```

2. Install Foundry if you haven't already (see [Foundry installation guide](https://book.getfoundry.sh/getting-started/installation))

3. Install dependencies:
```bash
forge install
```

4. Compile contracts:
```bash
forge build
```

5. Run tests (if available):
```bash
forge test
```

## How It Works

1. **Registration**: Connect your wallet and register with a username. You'll receive 2 TYC worth of vouchers as a welcome bonus.

2. **Create or Join a Game**: 
   - Create a public game anyone can join, or a private game with a custom code
   - Set your stake amount in USDC (stakes are optional but enable prize pools)
   - Choose your player symbol (hat, car, dog, etc.)

3. **Gameplay**: 
   - The backend coordinates turn order and game state
   - Roll dice, buy properties, pay rent - just like classic Monopoly
   - Use collectible perks for strategic advantages
   - All financial transactions happen on-chain via the smart contract

4. **Game End**: 
   - When only one player remains with positive balance (or meets other win conditions), the game ends
   - The smart contract automatically distributes USDC prizes to top 3 players
   - Winners receive bonus TYC vouchers and random collectible drops
   - All players can view their stats and transaction history

5. **Rewards**:
   - Redeem TYC vouchers for actual TYC tokens
   - Shop for additional collectibles using TYC or USDC
   - Build your collection of power-ups for future games

## Game Features

- **Multiple Game Modes**: Public games, private rooms with codes, AI practice mode
- **Flexible Stakes**: Play for free against AI or compete for USDC prizes
- **Collectible Perks**: Unlock and use strategic power-ups
- **Fair Randomness**: Dice rolls and collectible drops use blockchain randomness
- **Transparent Economics**: All reward distributions are on-chain and verifiable
- **Persistent Progress**: Your stats, wins, and collectibles are permanently recorded

## Technology Highlights

- **Built on Base and Celo**: Low fees, fast transactions, Ethereum security
- **ERC-1155 Rewards**: Efficient multi-token standard for vouchers and collectibles
- **Real-time Synchronization**: Socket.io ensures all players see updates instantly
- **Mobile-First Design**: Responsive UI works on phone, tablet, and desktop
- **Security First**: Reentrancy guards, pausable contracts, rate limiting

## Current Status

Tycoon is actively under development. The core game mechanics, contract system, and basic UI are functional. We're continuously improving the player experience, adding new collectible types, and refining the game balance.

The smart contracts are deployed and operational on Base and Celo. The frontend and backend are being polished for a smoother user experience.

## Contributing

Interested in contributing? We welcome:

- Bug reports and feature suggestions via GitHub Issues
- Code contributions via Pull Requests
- UI/UX improvements
- Documentation enhancements

Fork the repository, make your changes, and submit a PR!

## Project Links

- **Live Demo**: [https://base-monopoly.vercel.app](https://base-monopoly.vercel.app)
- **Base Contract Address**: `0xc6c2ccc0cA40d700DE2e5696f2a5e71dd838A1c4`
- **BaseScan**: View contract on [BaseScan](https://basescan.org/address/0xc6c2ccc0cA40d700DE2e5696f2a5e71dd838A1c4)

## Developer

Built by **Sabo Ajidokwu Emmanuel** ([@ajisabo2](https://twitter.com/ajisabo2))

## License

MIT License - see the [LICENSE](LICENSE) file for details.

---

**Roll the dice. Build your empire. Own your wins.**

*Powered by Base and Celo blockchains* ⚡