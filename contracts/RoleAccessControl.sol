// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract RoleAccessControl is AccessControl {   
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant WHOLESALER_ROLE = keccak256("WHOLESALER_ROLE");
    bytes32 public constant PHARMACY_ROLE = keccak256("PHARMACY_ROLE");
    bytes32 public constant DOCTOR_ROLE = keccak256("DOCTOR_ROLE");
    bytes32 public constant ADMIN_ROLE = DEFAULT_ADMIN_ROLE;

    constructor(address admin) {
    _grantRole(ADMIN_ROLE, admin); // ✅ This won't revert
}


    function registerManufacturer(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(MANUFACTURER_ROLE, account);
    }

    function registerWholesaler(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(WHOLESALER_ROLE, account);
    }

    function registerPharmacy(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(PHARMACY_ROLE, account);
    }

    function registerDoctor(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(DOCTOR_ROLE, account);
    }

    function isManufacturer(address account) external view returns (bool) {
        return hasRole(MANUFACTURER_ROLE, account);
    }

    function isWholesaler(address account) external view returns (bool) {
        return hasRole(WHOLESALER_ROLE, account);
    }

    function isPharmacy(address account) external view returns (bool) {
        return hasRole(PHARMACY_ROLE, account);
    }

    function isDoctor(address account) external view returns (bool) {
        return hasRole(DOCTOR_ROLE, account);
    }
}
