// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IRoleAccessControl.sol";

contract DrugBatchRegistry {
    IRoleAccessControl public immutable accessControl;

    struct Batch {
        address manufacturer;
        uint96 registeredAt;
        string ipfsCID;
        bool exists;
    }

    mapping(bytes32 => Batch) public batches;

    event BatchRegistered(
        bytes32 indexed batchId,
        string ipfsCID,
        address indexed manufacturer,
        uint256 timestamp
    );

    constructor(address accessControlAddr) {
        accessControl = IRoleAccessControl(accessControlAddr);
    }

    modifier onlyManufacturer() {
        require(accessControl.isManufacturer(msg.sender), "Not a manufacturer");
        _;
    }

    function registerBatch(string memory batchId, string memory ipfsCID) external onlyManufacturer {
        require(bytes(batchId).length > 0, "Invalid batchId");
        require(bytes(ipfsCID).length > 0, "Invalid IPFS CID");
        bytes32 batchIdHash = keccak256(bytes(batchId));
        require(!batches[batchIdHash].exists, "Batch already registered");

        batches[batchIdHash] = Batch({
            manufacturer: msg.sender,
            registeredAt: uint96(block.timestamp),
            ipfsCID: ipfsCID,
            exists: true
        });

        emit BatchRegistered(batchIdHash, ipfsCID, msg.sender, block.timestamp);
    }

    function getBatch(string memory batchId) external view returns (
        string memory ipfsCID,
        address manufacturer,
        uint256 registeredAt
    ) {
        bytes32 batchIdHash = keccak256(bytes(batchId));
        require(batches[batchIdHash].exists, "Batch does not exist");
        Batch memory b = batches[batchIdHash];
        return (b.ipfsCID, b.manufacturer, b.registeredAt);
    }
}
