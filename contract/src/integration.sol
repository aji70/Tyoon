// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract UserProfile {
    string public name;

    // Event emitted when the wallet address is set
    event NameSet(address indexed user, string newName);

    // Setter for name
    function setName(string memory newName) public {
        name = newName;
        emit NameSet(msg.sender, newName);
    }
}
