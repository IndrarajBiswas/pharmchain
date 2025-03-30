// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IRoleAccessControl.sol";
import "./interfaces/IDrugBatchRegistry.sol";

contract PrescriptionRegistry {
    IRoleAccessControl public accessControl;
    IDrugBatchRegistry public batchRegistry;

    struct Prescription {
        string prescriptionId;
        string batchId;
        address patient;
        string ipfsCID;
        address issuedBy;
        uint256 issuedAt;
        bool fulfilled;
        address fulfilledBy;
        uint256 fulfilledAt;
    }

    mapping(string => Prescription) public prescriptions;

    event PrescriptionIssued(
        string indexed prescriptionId,
        address indexed patient,
        string batchId,
        string ipfsCID,
        address indexed issuedBy,
        uint256 timestamp
    );

    event PrescriptionFulfilled(
        string indexed prescriptionId,
        address indexed pharmacy,
        uint256 timestamp
    );

    constructor(address accessControlAddr, address batchRegistryAddr) {
        accessControl = IRoleAccessControl(accessControlAddr);
        batchRegistry = IDrugBatchRegistry(batchRegistryAddr);
    }

    modifier onlyDoctor() {
        require(accessControl.isDoctor(msg.sender), "Not a doctor");
        _;
    }

    modifier onlyPharmacy() {
        require(accessControl.isPharmacy(msg.sender), "Not a pharmacy");
        _;
    }

    function issuePrescription(
        string memory prescriptionId,
        string memory batchId,
        address patient,
        string memory ipfsCID
    ) external onlyDoctor {
        require(bytes(prescriptionId).length > 0, "Invalid prescription ID");
        require(prescriptions[prescriptionId].issuedAt == 0, "Already issued");
        require(bytes(ipfsCID).length > 0, "Invalid IPFS CID");

        // Validate batch
        (,,uint256 registeredAt) = batchRegistry.getBatch(batchId);
        require(registeredAt > 0, "Batch not registered");

        prescriptions[prescriptionId] = Prescription({
            prescriptionId: prescriptionId,
            batchId: batchId,
            patient: patient,
            ipfsCID: ipfsCID,
            issuedBy: msg.sender,
            issuedAt: block.timestamp,
            fulfilled: false,
            fulfilledBy: address(0),
            fulfilledAt: 0
        });

        emit PrescriptionIssued(prescriptionId, patient, batchId, ipfsCID, msg.sender, block.timestamp);
    }

    function fulfillPrescription(string memory prescriptionId) external onlyPharmacy {
        Prescription storage p = prescriptions[prescriptionId];
        require(p.issuedAt != 0, "Prescription does not exist");
        require(!p.fulfilled, "Already fulfilled");

        p.fulfilled = true;
        p.fulfilledBy = msg.sender;
        p.fulfilledAt = block.timestamp;

        emit PrescriptionFulfilled(prescriptionId, msg.sender, block.timestamp);
    }

    function getPrescription(string memory prescriptionId) external view returns (Prescription memory) {
        return prescriptions[prescriptionId];
    }
}
