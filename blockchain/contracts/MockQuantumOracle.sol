// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockQuantumOracle {
    uint256 private nonce;
    
    event QuantumEntropyGenerated(bytes32 entropy, uint256 timestamp);
    
    function generateQuantumEntropy() external returns (bytes32) {
        nonce++;
        bytes32 entropy = keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            nonce,
            blockhash(block.number - 1),
            msg.sender
        ));
        
        emit QuantumEntropyGenerated(entropy, block.timestamp);
        return entropy;
    }
    
    function getLatestEntropy() external view returns (bytes32) {
        return keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            nonce
        ));
    }
}