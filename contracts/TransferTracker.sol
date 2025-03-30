// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IRoleAccessControl.sol";
import "./interfaces/IDrugBatchRegistry.sol";

contract TransferTracker {
    IRoleAccessControl public immutable accessControl;
    IDrugBatchRegistry public immutable batchRegistry;

    struct Transfer {
        address from;
        address to;
        uint96 timestamp;
        string ipfsCID;     // encrypted shipping metadata
    }

    // batchId => transfer history
    mapping(bytes32 => Transfer[]) public batchTransfers;

    event TransferLogged(
        bytes32 indexed batchId,
        address indexed from,
        address indexed to,
        string ipfsCID,
        uint256 timestamp
    );

    event TransferCountUpdated(
        bytes32 indexed batchId,
        uint256 totalTransfers
    );

    constructor(address accessControlAddr, address batchRegistryAddr) {
        accessControl = IRoleAccessControl(accessControlAddr);
        batchRegistry = IDrugBatchRegistry(batchRegistryAddr);
    }

    modifier onlyValidTransfer(address from, address to) {
        require(to != address(0), "Invalid recipient address");
        require(
            (accessControl.isManufacturer(from) && accessControl.isWholesaler(to)) ||
            (accessControl.isWholesaler(from) && accessControl.isPharmacy(to)),
            "Invalid transfer pair"
        );
        _;
    }

    function logTransfer(
        string memory batchId,
        address to,
        string memory ipfsCID
    ) external onlyValidTransfer(msg.sender, to) {
        require(bytes(batchId).length > 0, "Invalid batchId");
        require(bytes(ipfsCID).length > 0, "Invalid IPFS CID");

        bytes32 batchIdHash = keccak256(bytes(batchId));

        // Ensure batch exists
        (,,uint256 registeredAt) = batchRegistry.getBatch(batchId);
        require(registeredAt > 0, "Batch not registered");

        Transfer memory t = Transfer({
            from: msg.sender,
            to: to,
            timestamp: uint96(block.timestamp),
            ipfsCID: ipfsCID
        });

        batchTransfers[batchIdHash].push(t);

        emit TransferLogged(batchIdHash, msg.sender, to, ipfsCID, block.timestamp);
        emit TransferCountUpdated(batchIdHash, batchTransfers[batchIdHash].length);
    }

    function getTransferHistory(string memory batchId) external view returns (Transfer[] memory) {
        return batchTransfers[keccak256(bytes(batchId))];
    }

    function getTransferCount(string memory batchId) external view returns (uint256) {
        return batchTransfers[keccak256(bytes(batchId))].length;
    }
}
