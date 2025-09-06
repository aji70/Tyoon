// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Player {
    // Struct to represent a player
    struct PlayerData {
        string username;
        address playerAddress;
        uint64 timestamp;
    }

    // Mappings for storage (equivalent to Dojo models)
    mapping(address => bool) public isRegistered;
    mapping(address => string) public addressToUsername;
    mapping(string => address) public usernameToAddress;
    mapping(address => PlayerData) public players;

    // Event emitted when a player is created
    event PlayerCreated(string indexed username, address indexed player, uint64 timestamp);

    // Modifier to check if username is not empty
    modifier nonEmptyUsername(string memory username) {
        require(bytes(username).length > 0, "Username cannot be empty");
        _;
    }

    // Check if an address is registered
    function isUserRegistered(address playerAddress) public view returns (bool) {
        return isRegistered[playerAddress];
    }

    // Get username from address
    function getUsernameFromAddress(address playerAddress) public view returns (string memory) {
        return addressToUsername[playerAddress];
    }

    // Register a new player
    function registerNewPlayer(string memory username) public nonEmptyUsername(username) {
        address caller = msg.sender;
        uint64 timestamp = uint64(block.timestamp);

        // Check if username is already taken
        require(usernameToAddress[username] == address(0), "Username already taken");

        // Check if the caller already has a username
        require(bytes(addressToUsername[caller]).length == 0, "Username already created");

        // Register the player
        isRegistered[caller] = true;
        addressToUsername[caller] = username;
        usernameToAddress[username] = caller;
        players[caller] = PlayerData({username: username, playerAddress: caller, timestamp: timestamp});

        // Emit event
        emit PlayerCreated(username, caller, timestamp);
    }

    // Retrieve player data
    function retrievePlayer(address playerAddress) public view returns (PlayerData memory) {
        require(isRegistered[playerAddress], "Player not registered");
        return players[playerAddress];
    }
}
