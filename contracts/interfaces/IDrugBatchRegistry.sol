// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IDrugBatchRegistry {
    function getBatch(string memory batchId) external view returns (
        string memory ipfsCID,
        address manufacturer,
        uint256 registeredAt
    );
}
