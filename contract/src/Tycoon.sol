// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./Wallet.sol";

contract Tycoon is ReentrancyGuard {
    uint256 public totalUsers;
    uint256 public totalGames;
    uint256 private nextGameId;
    address public immutable token; // in-game ERC20 token
    address public immutable nft; // in-game NFT contract
    address public paymaster;
    uint256 public constant BOARD_SIZE = 40; // Monopoly-style board
    uint256 public constant STAKE_AMOUNT = 1 * 10 ** 18; // 1 token stake
    uint256 public constant WINNER_REWARD_MULTIPLIER = 150; // 150% of stake as reward (1.5x)
    uint256 public constant REWARD_DIVISOR = 100; // For percentage calculation (150 / 100 = 1.5)
    uint256 public constant MIN_TURNS_FOR_BONUS = 40; // Minimum total turns for win bonus

    // -------------------------
    // 📌 Structs
    // -------------------------

    struct User {
        uint256 id;
        string username;
        address playerAddress;
        uint64 registeredAt;
        uint256 gamesPlayed;
        uint256 gamesWon;
        uint256 gamesLost;
        uint256 totalStaked;
        uint256 totalEarned;
        uint256 totalWithdrawn;
    }

    enum GameStatus {
        Pending,
        Ongoing,
        Ended
    }
    enum GameType {
        PublicGame,
        PrivateGame
    }
    enum PlayerSymbol {
        Hat,
        Car,
        Dog,
        Thimble,
        Iron,
        Battleship,
        Boot,
        Wheelbarrow
    }

    struct Game {
        uint256 id;
        string code;
        address creator;
        GameStatus status;
        uint256 nextPlayer; // 1-based index of current turn
        address winner;
        uint8 numberOfPlayers;
        uint8 joinedPlayers;
        GameType mode;
        uint64 createdAt;
        uint64 endedAt;
        uint256 totalStaked; // Track total stakes for this game
    }

    struct GamePlayer {
        uint256 gameId;
        address playerAddress;
        uint256 balance;
        uint8 position;
        uint8 order;
        PlayerSymbol symbol;
        bool chanceJailCard;
        bool communityChestJailCard;
        string username;
    }

    struct GameSettings {
        uint8 maxPlayers;
        bool auction;
        bool rentInPrison;
        bool mortgage;
        bool evenBuild;
        uint256 startingCash;
        bool randomizePlayOrder;
        string privateRoomCode; // Optional if private
    }

    struct Property {
        uint8 id;
        uint256 gameId;
        address owner;
    }

    // -------------------------
    // 📌 Storage
    // -------------------------

    mapping(address => User) public users;
    mapping(string => address) private usernameToAddress; // to enforce unique usernames
    mapping(uint256 => address) private userIdToAddress; // lookup by sequential ID
    mapping(address => bool) public isRegistered;
    mapping(address => string) public addressToUsername;

    mapping(uint256 => Game) public games;
    mapping(uint256 => GameSettings) public gameSettings;
    mapping(uint256 => mapping(uint256 => Property)) public properties;
    mapping(uint256 => mapping(address => GamePlayer)) public gamePlayers; // GameId => Player

    // -------------------------
    // 📌 Events
    // -------------------------

    event PlayerCreated(string indexed username, address indexed player, uint64 timestamp);
    event GameCreated(uint256 indexed gameId, address indexed creator, uint64 timestamp);
    event DiceRolled(uint256 indexed gameId, address player, uint256 die1, uint256 die2, uint256 newPos);

    constructor(address _token, address _nft) {
        require(_token != address(0), "Invalid token address");
        require(_nft != address(0), "Invalid NFT address");
        token = _token;
        nft = _nft;
        paymaster = msg.sender;
    }

    // -------------------------
    // 📌 Modifiers
    // -------------------------

    modifier onlyPaymaster() {
        require(msg.sender == paymaster, "Not paymaster");
        _;
    }

    modifier nonEmptyUsername(string memory username) {
        require(bytes(username).length > 0, "Username cannot be empty");
        _;
    }

    // -------------------------
    // 📌 Player Management
    // -------------------------

    function registerPlayer(string memory username) public nonReentrant nonEmptyUsername(username) returns (uint256) {
        require(usernameToAddress[username] == address(0), "Username taken");
        totalUsers++;
        uint64 nowTime = uint64(block.timestamp);
        address userwallet = address(new Wallet(address(this)));

        users[userwallet] = User({
            id: totalUsers,
            username: username,
            playerAddress: userwallet,
            registeredAt: nowTime,
            gamesPlayed: 0,
            gamesWon: 0,
            gamesLost: 0,
            totalStaked: 0,
            totalEarned: 0,
            totalWithdrawn: 0
        });

        usernameToAddress[username] = userwallet;
        userIdToAddress[totalUsers] = userwallet;
        addressToUsername[userwallet] = username;

        IERC20(token).transfer(userwallet, 10 * 10 ** 18); // Initial token airdrop

        emit PlayerCreated(username, userwallet, nowTime);
        return totalUsers;
    }

    // -------------------------
    // 📌 Game Lifecycle
    // -------------------------

    function createGame(
        address creator,
        string memory gameType,
        string memory playerSymbol,
        uint8 numberOfPlayers,
        string memory code,
        uint256 startingBalance
    ) public onlyPaymaster nonReentrant returns (uint256) {
        require(numberOfPlayers >= 2 && numberOfPlayers <= 8, "Invalid player count");

        User storage user = users[creator];
        user.gamesPlayed += 1;
        user.totalStaked += STAKE_AMOUNT;
        IWallet(address(user.playerAddress)).withdrawERC20(token, address(this), STAKE_AMOUNT); // Stake to create game

        uint8 gType = _stringToGameType(gameType);
        uint8 pSym = _stringToPlayerSymbol(playerSymbol);

        uint256 gameId = nextGameId++;

        // Initialize game settings
        gameSettings[gameId] = GameSettings({
            maxPlayers: numberOfPlayers,
            auction: true, // default
            rentInPrison: false, // default
            mortgage: true, // default
            evenBuild: true, // default
            startingCash: startingBalance,
            randomizePlayOrder: false, // default
            privateRoomCode: code // reuse code for private if needed
        });

        games[gameId] = Game({
            id: gameId,
            code: code,
            creator: creator,
            status: GameStatus.Pending,
            nextPlayer: 1,
            winner: address(0),
            numberOfPlayers: numberOfPlayers,
            joinedPlayers: 1,
            mode: GameType(gType),
            createdAt: uint64(block.timestamp),
            endedAt: 0,
            totalStaked: STAKE_AMOUNT // Start with creator's stake
        });

        // Register creator in game
        gamePlayers[gameId][creator] = GamePlayer({
            gameId: gameId,
            playerAddress: creator,
            balance: startingBalance,
            position: 0,
            order: 1,
            symbol: PlayerSymbol(pSym),
            chanceJailCard: false,
            communityChestJailCard: false,
            username: users[creator].username
        });

        totalGames++;
        emit GameCreated(gameId, creator, uint64(block.timestamp));
        return gameId;
    }

    function joinGame(uint256 gameId, address player, string memory playerSymbol)
        public
        onlyPaymaster
        nonReentrant
        returns (uint8)
    {
        Game storage game = games[gameId];
        require(game.creator != address(0), "Game not found");
        require(game.status == GameStatus.Pending, "Game not open");
        require(game.joinedPlayers < game.numberOfPlayers, "Game full");
        require(gamePlayers[gameId][player].playerAddress == address(0), "Already joined");

        User storage user = users[player];
        user.gamesPlayed += 1;
        user.totalStaked += STAKE_AMOUNT;
        IWallet(address(user.playerAddress)).withdrawERC20(token, address(this), STAKE_AMOUNT); // Stake to join game
        game.totalStaked += STAKE_AMOUNT;

        uint8 pSym = _stringToPlayerSymbol(playerSymbol);

        uint8 order = game.joinedPlayers + 1;
        game.joinedPlayers++;

        gamePlayers[gameId][player] = GamePlayer({
            gameId: gameId,
            playerAddress: player,
            balance: gameSettings[gameId].startingCash,
            position: 0,
            order: order,
            symbol: PlayerSymbol(pSym),
            chanceJailCard: false,
            communityChestJailCard: false,
            username: users[player].username
        });
        if (game.joinedPlayers == game.numberOfPlayers) {
            game.status = GameStatus.Ongoing;
        }
        return order;
    }

    function removePlayerFromGame(uint256 gameId, address player, address finalCandidate, uint256 totalTurns)
        public
        onlyPaymaster
        nonReentrant
        returns (bool)
    {
        Game storage game = games[gameId];
        require(game.creator != address(0), "Game not found");
        require(game.status == GameStatus.Ongoing, "Game not ongoing");
        require(player != address(0), "Invalid player address");
        require(gamePlayers[gameId][player].playerAddress != address(0), "Player not in game");

        bool isFinalPhase = (game.joinedPlayers == 2);
        if (isFinalPhase) {
            require(finalCandidate != address(0), "Remaining player required");
            require(finalCandidate != player, "Candidate was removed");
            require(gamePlayers[gameId][finalCandidate].playerAddress != address(0), "Remaining player not in game");
        }

        // Update player lost
        User storage user = users[player];
        user.gamesLost += 1;

        // Remove the player
        delete gamePlayers[gameId][player];
        game.joinedPlayers -= 1;

        // If only one player remains, finalize game
        if (isFinalPhase) {
            game.status = GameStatus.Ended;
            game.winner = finalCandidate;
            game.endedAt = uint64(block.timestamp);

            User storage winnerUser = users[finalCandidate];
            winnerUser.gamesWon += 1;

            // Pay bonus only if totalTurns >= MIN_TURNS_FOR_BONUS
            if (totalTurns >= MIN_TURNS_FOR_BONUS) {
                uint256 reward = (STAKE_AMOUNT * WINNER_REWARD_MULTIPLIER) / REWARD_DIVISOR;
                winnerUser.totalEarned += reward;
                fund_smart_wallet_ERC20(finalCandidate, reward);
            }
        }

        return true;
    }

    // -------------------------
    // 📌 Gameplay
    // -------------------------

    function updatePlayerPosition(
        uint256 gameId,
        address player,
        uint8 newPosition,
        uint256 newBalance,
        uint8 propertyId
    ) public onlyPaymaster returns (bool) {
        Game storage game = games[gameId];
        require(game.status == GameStatus.Ongoing, "Game not ongoing");

        GamePlayer storage gp = gamePlayers[gameId][player];
        require(gp.playerAddress != address(0), "Player not found");

        gp.position = newPosition;
        gp.balance = newBalance;

        if (propertyId != 0) {
            Property storage prop = properties[gameId][propertyId];
            prop.owner = player;
        }

        return true;
    }

    // -------------------------
    // 📌 Views & Helpers
    // -------------------------

    function getUser(address a) public view returns (User memory) {
        require(users[a].playerAddress != address(0), "Not registered");
        return users[a];
    }

    function getUserById(uint256 id) public view returns (User memory) {
        address addr = userIdToAddress[id];
        require(addr != address(0), "Player not found");
        return users[addr];
    }

    function getGame(uint256 gameId) public view returns (Game memory) {
        require(games[gameId].creator != address(0), "Game not found");
        return games[gameId];
    }

    function getGameByCode(string memory code) public view returns (Game memory) {
        for (uint256 i = 0; i < nextGameId; i++) {
            if (keccak256(bytes(games[i].code)) == keccak256(bytes(code))) {
                return games[i];
            }
        }
        revert("Game not found");
    }

    function getGamePlayer(uint256 gameId, address a) public view returns (GamePlayer memory) {
        require(gamePlayers[gameId][a].playerAddress != address(0), "Player not in game");
        return gamePlayers[gameId][a];
    }

    function getProperty(uint256 gameId, uint8 propertyId) public view returns (Property memory) {
        require(properties[gameId][propertyId].id < 40, "Property not found");
        return properties[gameId][propertyId];
    }

    // -------------------------
    // 📌 String → Enum Helpers
    // -------------------------

    function _stringToGameType(string memory g) internal pure returns (uint8) {
        bytes32 h = keccak256(bytes(g));
        if (h == keccak256("PUBLIC")) return uint8(GameType.PublicGame);
        if (h == keccak256("PRIVATE")) return uint8(GameType.PrivateGame);
        revert("Invalid game type");
    }

    function _stringToPlayerSymbol(string memory s) internal pure returns (uint8) {
        bytes32 h = keccak256(bytes(s));
        if (h == keccak256("hat")) return uint8(PlayerSymbol.Hat);
        if (h == keccak256("car")) return uint8(PlayerSymbol.Car);
        if (h == keccak256("dog")) return uint8(PlayerSymbol.Dog);
        if (h == keccak256("thimble")) return uint8(PlayerSymbol.Thimble);
        if (h == keccak256("iron")) return uint8(PlayerSymbol.Iron);
        if (h == keccak256("battleship")) return uint8(PlayerSymbol.Battleship);
        if (h == keccak256("boot")) return uint8(PlayerSymbol.Boot);
        if (h == keccak256("wheelbarrow")) return uint8(PlayerSymbol.Wheelbarrow);
        revert("Invalid player symbol");
    }

    function debit_ETH_smart_wallet(address wallet, address to, uint256 amount) public returns (bool) {
        require(msg.sender == address(this), "Only contract can debit");
        IWallet w = IWallet(payable(wallet));
        w.withdrawETH(payable(to), amount);
        return true;
    }

    function debit_ERC20_smart_wallet(address wallet, address _token, address to, uint256 amount)
        public
        returns (bool)
    {
        require(msg.sender == address(this), "Only contract can debit");
        IWallet w = IWallet(payable(wallet));
        w.withdrawERC20(_token, to, amount);
        return true;
    }

    function fund_smart_wallet(address wallet) public payable returns (bool) {
        require(msg.sender == address(this), "Only contract can fund");
        (bool sent,) = payable(wallet).call{value: msg.value}("");
        require(sent, "Funding failed");
        return true;
    }

    function fund_smart_wallet_ERC20(address wallet, uint256 amount) public returns (bool) {
        require(msg.sender == paymaster || msg.sender == address(this), "Only paymaster or contract can fund");
        IERC20 erc20 = IERC20(token);
        bool ok = erc20.transfer(wallet, amount);
        require(ok, "ERC20 transfer failed");
        return true;
    }

    function get_smart_wallet_balance(address wallet) public view returns (uint256) {
        IWallet w = IWallet(payable(wallet));
        return w.getBalance();
    }

    function get_smart_wallet_ERC20_balance(address wallet, address _token) public view returns (uint256) {
        IWallet w = IWallet(payable(wallet));
        return w.getERC20Balance(_token);
    }

    receive() external payable {}
}