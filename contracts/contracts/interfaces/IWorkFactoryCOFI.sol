// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

interface IWorkFactoryCOFI {
    function notifyStatusChange(uint8 oldStatus, uint8 newStatus) external;
    function forwardToGenLayer(address workAddress) external;
}