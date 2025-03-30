// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IRoleAccessControl.sol";

contract DrugBatchRegistry {
    IRoleAccessControl public immutable accessControl;

    struct Batch {
        string batchId;
        string name;
        string dosage;
        string expirationDate;
        string description;
        string ipfsCID;
        address manufacturer;
        uint96 registeredAt;
        bool exists;
    }

    mapping(bytes32 => Batch) public batches;
    bytes32[] public batchIds;

    event BatchRegistered(
        string batchId,
        string name,
        string dosage,
        string expirationDate,
        string description,
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

    function registerBatch(
        string memory batchId,
        string memory name,
        string memory dosage,
        string memory expirationDate,
        string memory description,
        string memory ipfsCID
    ) external onlyManufacturer {
        require(bytes(batchId).length > 0, "Invalid batchId");
        require(bytes(ipfsCID).length > 0, "Invalid IPFS CID");

        bytes32 batchIdHash = keccak256(bytes(batchId));
        require(!batches[batchIdHash].exists, "Batch already registered");

        batches[batchIdHash] = Batch({
            batchId: batchId,
            name: name,
            dosage: dosage,
            expirationDate: expirationDate,
            description: description,
            ipfsCID: ipfsCID,
            manufacturer: msg.sender,
            registeredAt: uint96(block.timestamp),
            exists: true
        });

        batchIds.push(batchIdHash);

        emit BatchRegistered(
            batchId,
            name,
            dosage,
            expirationDate,
            description,
            ipfsCID,
            msg.sender,
            block.timestamp
        );
    }

    function getBatch(string memory batchId) external view returns (
        string memory name,
        string memory dosage,
        string memory expirationDate,
        string memory description,
        string memory ipfsCID,
        address manufacturer,
        uint256 registeredAt
    ) {
        bytes32 batchIdHash = keccak256(bytes(batchId));
        require(batches[batchIdHash].exists, "Batch does not exist");

        Batch memory b = batches[batchIdHash];
        return (
            b.name,
            b.dosage,
            b.expirationDate,
            b.description,
            b.ipfsCID,
            b.manufacturer,
            b.registeredAt
        );
    }

    function getAllBatchIds() external view returns (bytes32[] memory) {
        return batchIds;
    }
}
