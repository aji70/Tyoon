// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Blockopoly {
    // Struct to represent a player
    struct PlayerData {
        string username;
        address playerAddress;
        uint64 timestamp;
    }

    // Enums for Game struct
    enum GameStatus { Pending, Ongoing, Ended }
    enum GameType { PublicGame, PrivateGame }
    enum PlayerSymbol { Hat, Car, Dog, Thimble, Iron, Battleship, Boot, Wheelbarrow }

    // Struct to store game settings (from GameSettings UI)
    struct GameSettings {
        uint8 maxPlayers; // 2–8 players
        bool privateRoom; // URL-based access
        bool auction; // Auction unclaimed properties
        bool rentInPrison; // Collect rent in jail
        bool mortgage; // Enable mortgaging
        bool evenBuild; // Enforce even building
        uint256 startingCash; // Initial balance (100–1500)
        bool randomizePlayOrder; // Randomize turn order
    }

    // Struct to represent a game (exactly 7 fields)
    struct Game {
        uint256 id; // Incremental game ID (e.g., 1, 2, 3...)
        GameStatus status; // Pending, Ongoing, Ended
        address nextPlayer; // Player whose turn is next
        address winner; // Winning player
        uint64 createdAt; // Creation timestamp
        uint8 numberOfPlayers; // Max players (2–8)
        uint64 endedAt; // End timestamp
    }

    // Struct to represent a player’s state in a game (exactly 7 fields)
    struct GamePlayer {
        address playerAddress; // Player’s address
        uint256 gameId; // Game ID (uint256)
        string username; // Player’s username
        uint256 balance; // In-game currency
        uint8 position; // Board position (0–39)
        PlayerSymbol playerSymbol; // Chosen symbol
        bool isNext; // True if player’s turn
    }

    // Storage mappings
    mapping(address => bool) public isRegistered;
    mapping(address => string) public addressToUsername;
    mapping(string => address) public usernameToAddress;
    mapping(address => PlayerData) public players;
    mapping(uint256 => Game) public games; // Store games by uint256 ID
    mapping(uint256 => GameSettings) public gameSettings; // Game settings
    mapping(uint256 => mapping(address => PlayerSymbol)) public gamePlayerSymbols; // Player symbols
    mapping(uint256 => mapping(address => GamePlayer)) public gamePlayers; // Player state
    mapping(uint256 => mapping(address => bool)) public gamePlayersMap; // Players in game
    mapping(uint256 => bool) public usedGameIds; // Track used game IDs
    mapping(uint256 => mapping(uint256 => string)) public chanceCards; // Chance card deck
    mapping(uint256 => uint256) public chanceCardCount; // Chance card count
    mapping(uint256 => mapping(uint256 => string)) public communityCards; // Community Chest card deck
    mapping(uint256 => uint256) public communityCardCount; // Community Chest card count
    mapping(uint256 => mapping(address => mapping(uint8 => bool))) public propertiesOwnedMap; // Properties owned
    mapping(uint256 => mapping(address => uint8)) public propertiesOwnedCount; // Property count
    uint256 private gameIdCounter; // Counter for game ID generation

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
    function registerNewPlayer(string memory username) public nonEmptyUsername(username) {
        address caller = msg.sender;
        uint64 timestamp = uint64(block.timestamp);

        require(usernameToAddress[username] == address(0), "Username already taken");
        require(bytes(addressToUsername[caller]).length == 0, "Username already created");

        isRegistered[caller] = true;
        addressToUsername[caller] = username;
        usernameToAddress[username] = caller;
        players[caller] = PlayerData({username: username, playerAddress: caller, timestamp: timestamp});

        emit PlayerCreated(username, caller, timestamp);
    }

    // Generate a unique game ID
    function generateGameId() internal returns (uint256) {
        uint256 gameId = gameIdCounter++;
        usedGameIds[gameId] = true;
        return gameId;
    }

    // Initialize Chance card deck (simplified)
    function initializeChanceDeck(uint256 gameId) internal {
        string[2] memory deck = ["Advance to Go (Collect $200)", "Go to Jail"];
        for (uint256 i = 0; i < deck.length; i++) {
            chanceCards[gameId][i] = deck[i];
        }
        chanceCardCount[gameId] = deck.length;
    }

    // Initialize Community Chest card deck (simplified)
    function initializeCommunityDeck(uint256 gameId) internal {
        string[2] memory deck = ["Bank error in your favor - Collect $200", "Get Out of Jail Free"];
        for (uint256 i = 0; i < deck.length; i++) {
            communityCards[gameId][i] = deck[i];
        }
        communityCardCount[gameId] = deck.length;
    }

    // Create a new game
    function createGame(
        uint8 gameType,
        uint8 playerSymbol,
        uint8 numberOfPlayers,
        GameSettings memory settings
    ) public onlyRegistered returns (uint256) {
        require(numberOfPlayers >= 2 && numberOfPlayers <= 8, "Invalid number of players");
        require(gameType <= 1, "Invalid game type");
        require(playerSymbol <= 7, "Invalid player symbol");
        require(settings.maxPlayers == numberOfPlayers, "Settings maxPlayers mismatch");
        require(settings.startingCash >= 100 && settings.startingCash <= 1500, "Invalid starting cash");

        // Generate unique game ID
        uint256 gameId = generateGameId();

        // Initialize Game struct (7 fields)
        Game storage game = games[gameId];
        game.id = gameId;
        game.status = GameStatus.Pending;
        game.nextPlayer = msg.sender;
        game.winner = address(0);
        game.createdAt = uint64(block.timestamp);
        game.numberOfPlayers = numberOfPlayers;
        game.endedAt = 0;

        // Store settings
        gameSettings[gameId] = settings;

        // Initialize gamePlayersMap
        gamePlayersMap[gameId][msg.sender] = true;

        // Store player symbol
        gamePlayerSymbols[gameId][msg.sender] = PlayerSymbol(playerSymbol);

        // Initialize GamePlayer for creator (7 fields)
        string memory username = addressToUsername[msg.sender];
        GamePlayer storage player = gamePlayers[gameId][msg.sender];
        player.playerAddress = msg.sender;
        player.gameId = gameId;
        player.username = username;
        player.balance = settings.startingCash;
        player.position = 0;
        player.playerSymbol = PlayerSymbol(playerSymbol);
        player.isNext = true;

        // Initialize card decks
        initializeChanceDeck(gameId);
        initializeCommunityDeck(gameId);

        // Emit event with actual game ID
        emit GameCreated(gameId, msg.sender, uint64(block.timestamp));

        return gameId;
    }

    // Retrieve Game struct
    function getGame(uint256 gameId) public view returns (Game memory) {
        require(usedGameIds[gameId], "Game does not exist");
        return games[gameId];
    }
}