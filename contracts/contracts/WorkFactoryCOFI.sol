// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./WorkCOFI.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WorkFactoryCOFI is Ownable {

    address public immutable usdcToken;
    address public bridgeReceiver;

    address[] public allWorks;
    mapping(address => bool)    public deployedWorks;
    mapping(address => address) public workToCreator;

    address[] public openWorks;
    address[] public submittedWorks;
    address[] public validatingWorks;
    address[] public resolvedWorks;
    address[] public cancelledWorks;
    mapping(address => uint256) private workIndexInStatus;

    event WorkCreated(address indexed workAddress, address indexed creator, string title, uint256 bounty, uint256 endDate);
    event ValidationForwarded(address indexed workAddress, address indexed creator, string title, string descriptionPublic, string deliveryUrl, uint8 requiredApprovals, uint256 timestamp);
    event ResolutionDispatched(address indexed workAddress);
    event BridgeReceiverUpdated(address indexed old, address indexed newAddr);
    event WorkStatusChanged(address indexed workAddress, uint8 oldStatus, uint8 newStatus);

    constructor(address _usdcToken) Ownable(msg.sender) {
        require(_usdcToken != address(0), "USDC invalido");
        usdcToken = _usdcToken;
    }

    function setBridgeReceiver(address _bridgeReceiver) external onlyOwner {
        require(_bridgeReceiver != address(0), "Bridge invalido");
        address old = bridgeReceiver;
        bridgeReceiver = _bridgeReceiver;
        emit BridgeReceiverUpdated(old, _bridgeReceiver);
    }

    function createWork(
        string memory title,
        string memory descriptionPublic,
        uint256 bounty,
        uint256 endDate,
        uint8 requiredApprovals,
        bool isPrivate
    ) external returns (address) {
        require(bounty > 0, "Bounty invalido");
        require(endDate > block.timestamp, "Fecha invalida");
        require(requiredApprovals >= 3 && requiredApprovals <= 5, "Umbral invalido");

        require(IERC20(usdcToken).transferFrom(msg.sender, address(this), bounty), "USDC transfer fallida");

        WorkCOFI work = new WorkCOFI(msg.sender, title, descriptionPublic, endDate, usdcToken, address(this), requiredApprovals, isPrivate);
        address workAddress = address(work);

        require(IERC20(usdcToken).transfer(workAddress, bounty), "Transfer a contrato fallida");
        work.depositInitial(bounty);

        allWorks.push(workAddress);
        deployedWorks[workAddress] = true;
        workToCreator[workAddress] = msg.sender;
        workIndexInStatus[workAddress] = openWorks.length;
        openWorks.push(workAddress);

        emit WorkCreated(workAddress, msg.sender, title, bounty, endDate);
        return workAddress;
    }

    function notifyStatusChange(uint8 _oldStatus, uint8 _newStatus) external {
        require(deployedWorks[msg.sender], "No es un contrato registrado");
        _removeFromStatusArray(msg.sender, WorkCOFI.WorkStatus(_oldStatus));
        _addToStatusArray(msg.sender, WorkCOFI.WorkStatus(_newStatus));
        emit WorkStatusChanged(msg.sender, _oldStatus, _newStatus);
    }

    function forwardToGenLayer(address workAddress) external {
        require(deployedWorks[workAddress], "Contrato no registrado");
        require(msg.sender == workAddress, "Solo el propio contrato");
        WorkCOFI work = WorkCOFI(workAddress);
        emit ValidationForwarded(workAddress, work.creator(), work.title(), work.descriptionPublic(), work.deliveryUrl(), work.requiredApprovals(), block.timestamp);
    }

    function processBridgeMessage(uint32, address, bytes calldata _message) external {
        require(msg.sender == bridgeReceiver, "Solo bridge receiver");
        (address targetContract, bytes memory data) = abi.decode(_message, (address, bytes));
        require(deployedWorks[targetContract], "Contrato desconocido");
        WorkCOFI(targetContract).setResolution(data);
        emit ResolutionDispatched(targetContract);
    }

    function _removeFromStatusArray(address work, WorkCOFI.WorkStatus status) internal {
        address[] storage arr = _getStatusArray(status);
        if (arr.length == 0) return;
        uint256 idx = workIndexInStatus[work];
        uint256 lastIdx = arr.length - 1;
        if (idx != lastIdx) {
            address last = arr[lastIdx];
            arr[idx] = last;
            workIndexInStatus[last] = idx;
        }
        arr.pop();
    }

    function _addToStatusArray(address work, WorkCOFI.WorkStatus status) internal {
        address[] storage arr = _getStatusArray(status);
        workIndexInStatus[work] = arr.length;
        arr.push(work);
    }

    function _getStatusArray(WorkCOFI.WorkStatus status) internal view returns (address[] storage) {
        if (status == WorkCOFI.WorkStatus.OPEN)       return openWorks;
        if (status == WorkCOFI.WorkStatus.SUBMITTED)  return submittedWorks;
        if (status == WorkCOFI.WorkStatus.VALIDATING) return validatingWorks;
        if (status == WorkCOFI.WorkStatus.CANCELLED)  return cancelledWorks;
        return resolvedWorks;
    }

    function getAllWorks()        external view returns (address[] memory) { return allWorks; }
    function getOpenWorks()       external view returns (address[] memory) { return openWorks; }
    function getSubmittedWorks()  external view returns (address[] memory) { return submittedWorks; }
    function getValidatingWorks() external view returns (address[] memory) { return validatingWorks; }
    function getResolvedWorks()   external view returns (address[] memory) { return resolvedWorks; }
    function getWorkCount()       external view returns (uint256)          { return allWorks.length; }
    function isLegitWork(address w) external view returns (bool)          { return deployedWorks[w]; }
}