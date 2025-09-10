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
        uint gamesPlayed;
        uint gameWon;
        uint gameLost;
        uint totalStaked;
        uint totalEarned;
        uint totalWithdrawn;
    }

    // Enums for Game struct
    enum GameStatus { Pending, Ongoing, Ended }
    enum GameType { PublicGame, PrivateGame }
    enum PlayerSymbol { Hat, Car, Dog, Thimble, Iron, Battleship, Boot, Wheelbarrow }

    // Struct to represent a game (exactly 7 fields)
    struct Game {
        uint256 id;
        string code;
        address creator;
        GameStatus status;
        uint nextPlayer;
        address winner;
        uint8 numberOfPlayers;
        GameType mode;
        uint64 createdAt;
        uint64 endedAt;
    }

    // Struct to represent a player’s state in a game (exactly 7 fields)
    struct GamePlayer {
        uint256 gameId;
        address playerAddress;
        uint256 balance;
        uint8 position;
        uint order;
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

    struct GamePurchases{
        uint gameId;
        address ownerAddress;
        uint8 propertyId;
    }

    enum TradeOffer {
        PropertyForProperty,
        PropertyForCash,
        CashForProperty,
        CashPlusPropertyForProperty,
        PropertyForCashPlusProperty,
        CashForChanceJailCard,
        CashForCommunityJailCard,
        CommunityJailCardForCash,
        ChanceJailCardForCash
    }

    enum TradeStatus { Accepted, Rejected, Pending, Countered }

    // Structs translated from Starknet dojo::model (important fields only)
    struct TradeCounter {
        uint256 id; // Maps to felt252
        uint256 current_val;
    }

    struct TradeOfferDetails {
        uint256 id; // Key
        address from; // Maps to ContractAddress
        address to; // Maps to ContractAddress
        uint256 game_id;
        uint8[] offered_property_ids; // Maps to Array<u8>
        uint8[] requested_property_ids; // Maps to Array<u8>
        uint256 cash_offer;
        uint256 cash_request;
        TradeOffer trade_type;
        TradeStatus status;
    }

    struct Property {
        uint8 id; // Key
        uint256 game_id; // Key
        uint256 name; // Maps to felt252
        address owner; // Maps to ContractAddress
        PropertyType property_type;
        uint256 cost_of_property;
        uint8 group_id;
    }



    // Storage mappings
    mapping(address => bool) public isRegistered;
    mapping(address => string) public addressToUsername;
    mapping(string => address) public usernameToAddress;
    mapping(address => Users) public players;
    mapping(uint256 => Game) public games;
    mapping(uint256 => GameSettings) public gameSettings;
    mapping(uint256 => mapping(address => PlayerSymbol)) public gamePlayerSymbols;
    mapping(uint256 => mapping(address => GamePlayer)) public gamePlayers;
    mapping(uint256 => mapping(address => bool)) public gamePlayersMap;
    mapping(uint256 => bool) public usedGameIds;
    mapping(uint256 => mapping(uint256 => string)) public chanceCards;
    mapping(uint256 => uint256) public chanceCardCount;
    mapping(uint256 => mapping(uint256 => string)) public communityCards;
    mapping(uint256 => uint256) public communityCardCount;
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
    function registerNewPlayer(string memory username) public nonEmptyUsername(username) {
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
            gamesPlayed: 0, // Initialize missing fields
            gameWon: 0,
            gameLost: 0,
            totalStaked: 0,
            totalEarned: 0,
            totalWithdrawn: 0
        });

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

        uint256 gameId = generateGameId();

        Game storage game = games[gameId];
        game.id = gameId;
        game.status = GameStatus.Pending;
        game.nextPlayer = msg.sender; // Note: Stored as uint, should be address
        game.winner = address(0);
        game.createdAt = uint64(block.timestamp);
        game.numberOfPlayers = numberOfPlayers;
        game.endedAt = 0;

        gameSettings[gameId] = settings;
        gamePlayersMap[gameId][msg.sender] = true;
        gamePlayerSymbols[gameId][msg.sender] = PlayerSymbol(playerSymbol);

        string memory username = addressToUsername[msg.sender];
        GamePlayer storage player = gamePlayers[gameId][msg.sender];
        player.playerAddress = msg.sender;
        player.gameId = gameId;
        player.username = username;
        player.balance = settings.startingCash;
        player.position = 0;
        player.playerSymbol = PlayerSymbol(playerSymbol);
        player.order = 1; // Initialize order

        initializeChanceDeck(gameId);
        initializeCommunityDeck(gameId);

        emit GameCreated(gameId, msg.sender, uint64(block.timestamp));

        return gameId;
    }

    // Retrieve Game struct
    function getGame(uint256 gameId) public view returns (Game memory) {
        require(usedGameIds[gameId], "Game does not exist");
        return games[gameId];
    }
}