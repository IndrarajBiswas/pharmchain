// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IRoleAccessControl.sol";

contract ZKCredentialIssuer {
    IRoleAccessControl public immutable accessControl;

    struct CredentialMetadata {
        address subject;
        address issuer;
        uint96 issuedAt;
        string schema;
    }

    // credentialHash => metadata
    mapping(bytes32 => CredentialMetadata) public issuedCredentials;

    event CredentialIssued(
        bytes32 indexed credentialHash,
        string schema,
        address indexed subject,
        address indexed issuer,
        uint256 issuedAt
    );

    constructor(address accessControlAddr) {
        accessControl = IRoleAccessControl(accessControlAddr);
    }

    modifier onlyRegisteredIssuer() {
        require(
            accessControl.isDoctor(msg.sender) ||
            accessControl.isManufacturer(msg.sender) ||
            accessControl.isPharmacy(msg.sender),
            "Not authorized issuer"
        );
        _;
    }

    function issueCredentialHash(
        bytes32 credentialHash,
        string memory schema,
        address subject
    ) external onlyRegisteredIssuer {
        require(credentialHash != bytes32(0), "Invalid hash");
        require(subject != address(0), "Invalid subject");
        require(issuedCredentials[credentialHash].issuedAt == 0, "Already issued");

        issuedCredentials[credentialHash] = CredentialMetadata({
            subject: subject,
            issuer: msg.sender,
            issuedAt: uint96(block.timestamp),
            schema: schema
        });

        emit CredentialIssued(
            credentialHash,
            schema,
            subject,
            msg.sender,
            block.timestamp
        );
    }

    function verifyCredentialHash(bytes32 credentialHash) external view returns (bool) {
        return issuedCredentials[credentialHash].issuedAt != 0;
    }
}
