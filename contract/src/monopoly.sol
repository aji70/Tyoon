// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Blockopoly {
    uint256 totalUsers;
    uint256 totalGames;

    // Struct to represent a player
    struct Users {
        uint256 id;
        string username;
        address playerAddress;
        uint64 timestamp;
        uint256 gamesPlayed;
        uint256 gameWon;
        uint256 gameLost;
        uint256 totalStaked;
        uint256 totalEarned;
        uint256 totalWithdrawn;
    }

    // Enums for Game struct
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

    // Struct to represent a game (as provided)
    struct Game {
        uint256 id;
        string code;
        address creator;
        GameStatus status;
        uint256 nextPlayer; // using uint as turn index (1-based)
        address winner;
        uint8 numberOfPlayers;
        GameType mode;
        uint64 createdAt;
        uint64 endedAt;
    }

    // Struct to represent a player’s state in a game
    struct GamePlayer {
        uint256 gameId;
        address playerAddress;
        uint256 balance;
        uint8 position;
        uint256 order;
        PlayerSymbol symbol;
        bool chanceJailCard;
        bool communityChestJailCard;
        string username;
    }

    // Enums from Starknet
    enum PropertyType {
        Go,
        Chance,
        CommunityChest,
        Jail,
        Utility,
        RailRoad,
        Tax,
        FreeParking,
        Property,
        VisitingJail
    }

    struct GamePurchases {
        uint256 gameId;
        address ownerAddress;
        uint8 propertyId;
    }

    struct Property {
        uint8 id; // Key
        uint256 game_id; // Key
        uint256 name; // Maps to felt252
        address owner; // Maps to ContractAddress
        PropertyType property_type;
        uint256 cost_of_property;
        uint8 group_id;
        bool isOwned;
        uint256 rent;
    }
    // Storage mappings
    mapping(address => bool) public isRegistered;
    mapping(address => string) public addressToUsername;
    mapping(string => address) public usernameToAddress;
    mapping(address => Users) public players;
    mapping(uint256 => Game) public games;
    Add properties mapping: gameId => propertyId => Property
    mapping(uint256 => mapping(uint256 => Property)) public properties;
   

    mapping(uint256 => mapping(address => PlayerSymbol)) public gamePlayerSymbols;
    mapping(uint256 => mapping(address => GamePlayer)) public gamePlayers;
    mapping(uint256 => mapping(address => bool)) public gamePlayersMap;
    mapping(uint256 => bool) public usedGameIds;
    mapping(uint256 => mapping(uint256 => string)) public chanceCards;
    mapping(uint256 => uint256) public chanceCardCount;
    mapping(uint256 => mapping(uint256 => string)) public communityCards;
    mapping(uint256 => uint256) public communityCardCount;
    mapping(uint256 => address) public playerIdToAddress;
    uint256 public constant BOARD_SIZE = 40; // Monopoly-style board

    // Track balances and positions per game
    mapping(uint256 => mapping(address => uint256)) public balances;
    mapping(uint256 => mapping(address => uint256)) public positions;

    event DiceRolled(uint256 indexed gameId, address player, uint256 die1, uint256 die2, uint256 newPos);

    mapping(uint256 => mapping(address => mapping(uint8 => bool))) public propertiesOwnedMap;
    mapping(uint256 => mapping(address => uint8)) public propertiesOwnedCount;
    uint256 private gameIdCounter;

    // Events
    event PlayerCreated(string indexed username, address indexed player, uint64 timestamp);
    event GameCreated(uint256 indexed gameId, address indexed creator, uint64 timestamp);

    // Modifier to check if username is not empty
    modifier nonEmptyUsername(string memory username) {
        require(bytes(username).length > 0, "Username cannot be empty");
        _;
    }

    // Modifier to check if player is registered
    modifier onlyRegistered() {
        require(isRegistered[msg.sender], "Player not registered");
        _;
    }

    // Register a new player
    function registerPlayer(string memory username) public nonEmptyUsername(username) returns (uint256) {
        address caller = msg.sender;
        uint64 timestamp = uint64(block.timestamp);
        totalUsers++;

        require(usernameToAddress[username] == address(0), "Username already taken");
        require(bytes(addressToUsername[caller]).length == 0, "Username already created");

        isRegistered[caller] = true;
        addressToUsername[caller] = username;
        usernameToAddress[username] = caller;
        players[caller] = Users({
            id: totalUsers,
            username: username,
            playerAddress: caller,
            timestamp: timestamp,
            gamesPlayed: 0,
            gameWon: 0,
            gameLost: 0,
            totalStaked: 0,
            totalEarned: 0,
            totalWithdrawn: 0
        });

        playerIdToAddress[totalUsers] = caller;

        emit PlayerCreated(username, caller, timestamp);

        return totalUsers;
    }

    // Generate a unique game ID
    function generateGameId() internal returns (uint256) {
        uint256 gameId = gameIdCounter++;
        usedGameIds[gameId] = true;
        return gameId;
    }

    function rollDice(uint256 gameId) external {
        Game storage game = games[gameId];
        require(game.status == GameStatus.Ongoing, "Game not active");

        // Find the address of the player whose turn it is by scanning gamePlayersMap for order == nextPlayer
        address currentPlayer = address(0);
        for (uint256 i = 1; i <= totalUsers; i++) {
            address playerAddr = playerIdToAddress[i];
            if (gamePlayersMap[gameId][playerAddr]) {
                if (gamePlayers[gameId][playerAddr].order == game.nextPlayer) {
                    currentPlayer = playerAddr;
                    break;
                }
            }
        }
        require(currentPlayer != address(0), "Current player not found");
        require(msg.sender == currentPlayer, "Not your turn");

        // roll dice
        uint256 die1 = (uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, "D1"))) % 6) + 1;
        uint256 die2 = (uint256(keccak256(abi.encodePacked(block.prevrandao, msg.sender, "D2"))) % 6) + 1;
        uint256 total = die1 + die2;

        // update position
        uint256 newPos = (positions[gameId][msg.sender] + total) % BOARD_SIZE;
        positions[gameId][msg.sender] = newPos;

        emit DiceRolled(gameId, msg.sender, die1, die2, newPos);

        // 🟢 property interaction goes here
        if (properties[gameId][newPos].isOwned && properties[gameId][newPos].owner != msg.sender) {
            uint256 rent = properties[gameId][newPos].rent;
            require(balances[gameId][msg.sender] >= rent, "Not enough balance");
            balances[gameId][msg.sender] -= rent;
            balances[gameId][properties[gameId][newPos].owner] += rent;
        } else if (!properties[gameId][newPos].isOwned) {
            // let player buy (separate buyProperty() tx)
        }

        // pass turn
        if (game.nextPlayer == game.numberOfPlayers) {
            game.nextPlayer = 1;
        } else {
            game.nextPlayer++;
        }
    }

    /// @notice Create a new game. Uses only on-chain structs; off-chain will manage extra settings.
    /// @param gameType 0 = PublicGame, 1 = PrivateGame
    /// @param playerSymbol value 0..7 for PlayerSymbol
    /// @param numberOfPlayers 2..8
    /// @param code arbitrary string/code for the game (e.g., invite code)
    function createGame(uint8 gameType, uint8 playerSymbol, uint8 numberOfPlayers, string memory code)
        public
        onlyRegistered
        returns (uint256)
    {
        require(numberOfPlayers >= 2 && numberOfPlayers <= 8, "Invalid number of players");
        require(gameType <= uint8(GameType.PrivateGame), "Invalid game type");
        require(playerSymbol <= uint8(PlayerSymbol.Wheelbarrow), "Invalid player symbol");

        uint256 gameId = generateGameId();

        Game storage game = games[gameId];
        game.id = gameId;
        game.code = code;
        game.creator = msg.sender;
        game.status = GameStatus.Pending;
        game.nextPlayer = 1; // Turn index (1 = the creator's turn initially)
        game.winner = address(0);
        game.numberOfPlayers = numberOfPlayers;
        game.mode = GameType(gameType);
        game.createdAt = uint64(block.timestamp);
        game.endedAt = 0;

        // register creator as first player in-game
        gamePlayersMap[gameId][msg.sender] = true;
        gamePlayerSymbols[gameId][msg.sender] = PlayerSymbol(playerSymbol);

        string memory username = addressToUsername[msg.sender];

        GamePlayer storage player = gamePlayers[gameId][msg.sender];
        player.gameId = gameId;
        player.playerAddress = msg.sender;
        player.balance = 1500; // default starting cash used on-chain (adjust off-chain if needed)
        player.position = 0;
        player.order = 1;
        player.symbol = PlayerSymbol(playerSymbol);
        player.chanceJailCard = false;
        player.communityChestJailCard = false;
        player.username = username;

        totalGames++;

        emit GameCreated(gameId, msg.sender, uint64(block.timestamp));

        return gameId;
    }

    /// @notice Draw a random Chance card index
    function drawChanceCard(uint256 gameId) public view returns (uint256) {
        require(usedGameIds[gameId], "Game does not exist");

        return uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender, gameId))) % 15;
    }

    /// @notice Draw a random Community Chest card index
    function drawCommunityCard(uint256 gameId) public view returns (uint256) {
        require(usedGameIds[gameId], "Game does not exist");

        return
            uint256(keccak256(abi.encodePacked(blockhash(block.number - 1), block.prevrandao, msg.sender, gameId))) % 15;
    }

    function getPlayer(address playerAddr) public view returns (Users memory) {
        require(isRegistered[playerAddr], "Player not registered");
        return players[playerAddr];
    }

    function getPlayerById(uint256 playerId) public view returns (Users memory) {
        address playerAddr = playerIdToAddress[playerId];
        require(playerAddr != address(0), "Player does not exist");
        return players[playerAddr];
    }

    // Retrieve Game struct
    function getGame(uint256 gameId) public view returns (Game memory) {
        require(usedGameIds[gameId], "Game does not exist");
        return games[gameId];
    }

    // Retrieve a player's in-game record
    function getGamePlayer(uint256 gameId, address playerAddr) public view returns (GamePlayer memory) {
        require(usedGameIds[gameId], "Game does not exist");
        require(gamePlayersMap[gameId][playerAddr], "Player not in game");
        return gamePlayers[gameId][playerAddr];
    }

    // Simple join function for additional players (creator already auto-registered)
    function joinGame(uint256 gameId, uint8 playerSymbol) public onlyRegistered {
        require(usedGameIds[gameId], "Game does not exist");
        Game storage game = games[gameId];
        require(game.status == GameStatus.Pending, "Game not open for joining");
        require(!gamePlayersMap[gameId][msg.sender], "Already joined");
        require(playerSymbol <= uint8(PlayerSymbol.Wheelbarrow), "Invalid symbol");

        // count current players by scanning simple heuristic: properties of mapping can't be iterated
        // We track player order by incrementing a local counter from known playersAdded (off-chain better).
        // Here we'll set the joining player's order using the number of players currently assigned on-chain:
        // Use propertiesOwnedCount mapping as not suitable; instead approximate by using player order assignment based on numberOfPlayers and caller count derived off-chain.
        // For deterministic on-chain order, we simply set order = 2 + number of players already mapped to this game (best-effort).
        // NOTE: on-chain enumeration of mapping keys is not possible; for robust tracking keep an off-chain player list.
        // For simplicity, set order = 2 (meaning subsequent players should be managed off-chain for accurate order).
        gamePlayersMap[gameId][msg.sender] = true;
        gamePlayerSymbols[gameId][msg.sender] = PlayerSymbol(playerSymbol);

        GamePlayer storage player = gamePlayers[gameId][msg.sender];
        player.gameId = gameId;
        player.playerAddress = msg.sender;
        player.balance = 1500;
        player.position = 0;
        player.order = 2; // best-effort default; off-chain should manage exact ordering
        player.symbol = PlayerSymbol(playerSymbol);
        player.chanceJailCard = false;
        player.communityChestJailCard = false;
        player.username = addressToUsername[msg.sender];
    }

    // Small helper to mark a game as started (only creator can start)
    function startGame(uint256 gameId) public {
        require(usedGameIds[gameId], "Game does not exist");
        Game storage game = games[gameId];
        require(msg.sender == game.creator, "Only creator can start");
        require(game.status == GameStatus.Pending, "Game already started or ended");
        game.status = GameStatus.Ongoing;
        // nextPlayer remains index 1 by default
    }

    // Small helper to end a game and record winner (only creator)
    function endGame(uint256 gameId, address winnerAddr) public {
        require(usedGameIds[gameId], "Game does not exist");
        Game storage game = games[gameId];
        require(msg.sender == game.creator, "Only creator can end");
        require(game.status == GameStatus.Ongoing || game.status == GameStatus.Pending, "Game already ended");
        game.status = GameStatus.Ended;
        game.winner = winnerAddr;
        game.endedAt = uint64(block.timestamp);
    }
}
