// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./CivicoCOFI.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title CivicoFactoryCOFI - Factory para propuestas cívicas
contract CivicoFactoryCOFI is Ownable {

    address public immutable usdcToken;

    address[] public allProposals;
    mapping(address => bool) public deployedProposals;

    address[] public votingProposals;
    address[] public approvedProposals;
    address[] public rejectedProposals;
    address[] public cancelledProposals;
    mapping(address => uint256) private proposalIndexInStatus;

    event ProposalCreated(
        address indexed proposalAddress,
        address indexed creator,
        string  title,
        uint256 funds,
        uint256 endDate
    );
    event ProposalStatusChanged(
        address indexed proposalAddress,
        uint8 newStatus
    );

    constructor(address _usdcToken) Ownable(msg.sender) {
        require(_usdcToken != address(0), "USDC invalido");
        usdcToken = _usdcToken;
    }

    function createProposal(
        string memory title,
        string memory description,
        address destinationAddress,
        uint256 funds,
        uint256 endDate,
        bool    isPrivate
    ) external returns (address) {
        require(funds > 0,                    "Fondos invalidos");
        require(endDate > block.timestamp,    "Fecha invalida");
        require(destinationAddress != address(0), "Destino invalido");

        // Transferir USDC del creador
        require(
            IERC20(usdcToken).transferFrom(msg.sender, address(this), funds),
            "USDC transfer fallida"
        );

        // Deploy del contrato individual
        CivicoCOFI proposal = new CivicoCOFI(
            msg.sender,
            title,
            description,
            destinationAddress,
            endDate,
            usdcToken,
            isPrivate
        );

        address proposalAddress = address(proposal);

        // Transferir USDC al contrato
        require(
            IERC20(usdcToken).transfer(proposalAddress, funds),
            "Transfer a propuesta fallida"
        );
        proposal.depositInitial(funds);

        // Registrar
        allProposals.push(proposalAddress);
        deployedProposals[proposalAddress] = true;
        proposalIndexInStatus[proposalAddress] = votingProposals.length;
        votingProposals.push(proposalAddress);

        emit ProposalCreated(proposalAddress, msg.sender, title, funds, endDate);
        return proposalAddress;
    }

    function getAllProposals()       external view returns (address[] memory) { return allProposals; }
    function getVotingProposals()    external view returns (address[] memory) { return votingProposals; }
    function getApprovedProposals()  external view returns (address[] memory) { return approvedProposals; }
    function getRejectedProposals()  external view returns (address[] memory) { return rejectedProposals; }
    function getProposalCount()      external view returns (uint256)          { return allProposals.length; }
    function isLegitProposal(address p) external view returns (bool)         { return deployedProposals[p]; }
}