// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IRoleAccessControl {
    function isDoctor(address account) external view returns (bool);
    function isManufacturer(address account) external view returns (bool);
    function isPharmacy(address account) external view returns (bool);
    function isWholesaler(address account) external view returns (bool);
}
