// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Tycoon.sol";

contract TycoonTest is Test {
    Tycoon public tycoon;
    address public owner;
    address public player1;
    address public player2;
    address public player3;

    event PlayerRegistered(address indexed player, string username);
    event GameCreated(uint256 indexed gameId, address indexed creator, uint256 stake);
    event PlayerJoinedGame(uint256 indexed gameId, address indexed player);
    event GameEnded(uint256 indexed gameId, address indexed winner);

    function setUp() public {
        owner = address(this);
        player1 = makeAddr("player1");
        player2 = makeAddr("player2");
        player3 = makeAddr("player3");

        // Deploy the Tycoon contract
        tycoon = new Tycoon();

        // Fund test accounts
        vm.deal(player1, 100 ether);
        vm.deal(player2, 100 ether);
        vm.deal(player3, 100 ether);
    }

    /*//////////////////////////////////////////////////////////////
                        PLAYER REGISTRATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_RegisterPlayer() public {
        vm.startPrank(player1);
        
        vm.expectEmit(true, true, false, true);
        emit PlayerRegistered(player1, "Alice");
        
        tycoon.registerPlayer("Alice");
        
        // Verify player is registered
        // Note: Add getter functions in your contract if not present
        // bool isRegistered = tycoon.isPlayerRegistered(player1);
        // assertTrue(isRegistered, "Player should be registered");
        
        vm.stopPrank();
    }

    function test_RevertWhen_RegisteringWithEmptyUsername() public {
        vm.startPrank(player1);
        
        vm.expectRevert(); // Update with specific error message if defined
        tycoon.registerPlayer("");
        
        vm.stopPrank();
    }

    function test_RevertWhen_RegisteringTwice() public {
        vm.startPrank(player1);
        
        tycoon.registerPlayer("Alice");
        
        vm.expectRevert(); // Update with specific error message
        tycoon.registerPlayer("AliceAgain");
        
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                        GAME CREATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_CreatePublicGame() public {
        // First register player
        vm.startPrank(player1);
        tycoon.registerPlayer("Alice");
        
        uint256 stake = 0.1 ether;
        uint256 startingBalance = 1500;
        uint8 maxPlayers = 4;
        
        // Create game
        // Note: Update function signature based on your actual contract
        // uint256 gameId = tycoon.createGame{value: stake}(
        //     false, // isPrivate
        //     maxPlayers,
        //     stake,
        //     startingBalance
        // );
        
        // assertGt(gameId, 0, "Game ID should be greater than 0");
        
        vm.stopPrank();
    }

    function test_CreatePrivateGame() public {
        vm.startPrank(player1);
        tycoon.registerPlayer("Alice");
        
        // Create private game with room code
        // Test implementation based on your contract
        
        vm.stopPrank();
    }

    function test_CreateAIGame() public {
        vm.startPrank(player1);
        tycoon.registerPlayer("Alice");
        
        // Create AI practice game
        // Test implementation based on your contract
        
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                        GAME JOINING TESTS
    //////////////////////////////////////////////////////////////*/

    function test_JoinPublicGame() public {
        // Player 1 creates game
        vm.startPrank(player1);
        tycoon.registerPlayer("Alice");
        // uint256 gameId = tycoon.createGame(...);
        vm.stopPrank();
        
        // Player 2 joins game
        vm.startPrank(player2);
        tycoon.registerPlayer("Bob");
        // tycoon.joinGame{value: stake}(gameId);
        vm.stopPrank();
        
        // Verify player joined
    }

    function test_RevertWhen_JoiningFullGame() public {
        // Create game with max 2 players
        // Have 2 players join
        // Third player should fail to join
        
        // vm.expectRevert("Game is full");
        // tycoon.joinGame(gameId);
    }

    /*//////////////////////////////////////////////////////////////
                        REWARD DISTRIBUTION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_RewardDistribution() public {
        // Create a game with stakes
        // Simulate game completion
        // Verify rewards are distributed correctly:
        // - 50% to 1st place
        // - 30% to 2nd place
        // - 20% to 3rd place
        // - 5% house fee
        
        // Example:
        // uint256 totalPrizePool = 4 * 0.1 ether;
        // uint256 expectedFirst = (totalPrizePool * 50) / 100;
        // assertEq(player1Balance, expectedFirst);
    }

    function test_ConsolationVouchers() public {
        // Test that losing players receive 0.1 TYC vouchers
    }

    /*//////////////////////////////////////////////////////////////
                        ACCESS CONTROL TESTS
    //////////////////////////////////////////////////////////////*/

    function test_RevertWhen_UnauthorizedPause() public {
        vm.startPrank(player1);
        
        // Only owner should be able to pause
        // vm.expectRevert();
        // tycoon.pause();
        
        vm.stopPrank();
    }

    function test_OwnerCanPause() public {
        // tycoon.pause();
        // assertTrue(tycoon.paused());
    }

    /*//////////////////////////////////////////////////////////////
                        EDGE CASES & FAILURE SCENARIOS
    //////////////////////////////////////////////////////////////*/

    function test_RevertWhen_InsufficientStake() public {
        vm.startPrank(player1);
        tycoon.registerPlayer("Alice");
        
        // Try to create game with stake below minimum
        // vm.expectRevert("Stake too low");
        // tycoon.createGame{value: 0.001 ether}(...);
        
        vm.stopPrank();
    }

    function test_RevertWhen_GameNotStarted() public {
        // Try to make moves in a game that hasn't started
    }

    function test_RevertWhen_NotPlayerTurn() public {
        // Try to roll dice when it's not your turn
    }

    /*//////////////////////////////////////////////////////////////
                        HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    receive() external payable {}
}
