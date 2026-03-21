// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title CivicoCOFI - Propuestas cívicas con fondos retenidos y votación comunitaria
contract CivicoCOFI is ReentrancyGuard, Ownable {

    enum ProposalStatus { VOTING, APPROVED, REJECTED, CANCELLED }

    address public immutable creator;
    string  public title;
    string  public description;
    address public immutable destinationAddress;
    uint256 public immutable creationDate;
    uint256 public immutable endDate;
    IERC20  public immutable token;
    uint256 public totalFunds;
    bool    public isPrivate;

    ProposalStatus public status;

    mapping(address => bool)    public hasVoted;
    mapping(address => bool)    public voteChoice;
    uint256 public votesYes;
    uint256 public votesNo;

    event ProposalCreated(address indexed creator, string title, uint256 funds, uint256 endDate);
    event VoteCast(address indexed voter, bool inFavor);
    event ProposalApproved(address indexed destination, uint256 amount);
    event ProposalRejected(address indexed creator, uint256 amount);
    event ProposalCancelled(address indexed creator);

    constructor(
        address _creator,
        string memory _title,
        string memory _description,
        address _destinationAddress,
        uint256 _endDate,
        address _token,
        bool    _isPrivate
    ) Ownable(_creator) {
        require(_creator            != address(0), "Creator invalido");
        require(_token              != address(0), "Token invalido");
        require(_destinationAddress != address(0), "Destino invalido");
        require(bytes(_title).length > 0,          "Titulo vacio");
        require(_endDate > block.timestamp,        "Fecha invalida");

        creator            = _creator;
        title              = _title;
        description        = _description;
        destinationAddress = _destinationAddress;
        creationDate       = block.timestamp;
        endDate            = _endDate;
        token              = IERC20(_token);
        isPrivate          = _isPrivate;
        status             = ProposalStatus.VOTING;
    }

    // ============ Depósito inicial ============

    function depositInitial(uint256 amount) external {
        require(amount > 0, "Monto invalido");
        totalFunds += amount;
        emit ProposalCreated(creator, title, totalFunds, endDate);
    }

    // ============ Votación ============

    function vote(bool inFavor) external {
        require(status == ProposalStatus.VOTING,    "No en votacion");
        require(block.timestamp < endDate,          "Votacion cerrada");
        require(!hasVoted[msg.sender],              "Ya votaste");

        hasVoted[msg.sender]  = true;
        voteChoice[msg.sender] = inFavor;

        if (inFavor) {
            votesYes++;
        } else {
            votesNo++;
        }

        emit VoteCast(msg.sender, inFavor);
    }

    // ============ Ejecutar resultado ============

    /// @notice Cualquiera puede llamar esto después de que venza el plazo
    function execute() external nonReentrant {
        require(status == ProposalStatus.VOTING, "Ya ejecutado");
        require(block.timestamp >= endDate,      "Plazo no vencido");

        uint256 total = votesYes + votesNo;

        if (total == 0 || votesNo >= votesYes) {
            // Sin votos o mayoría NO → devolver al creador
            status = ProposalStatus.REJECTED;
            if (totalFunds > 0) {
                require(token.transfer(creator, totalFunds), "Devolucion fallida");
            }
            emit ProposalRejected(creator, totalFunds);
        } else {
            // Mayoría SÍ → transferir al destino
            status = ProposalStatus.APPROVED;
            if (totalFunds > 0) {
                require(token.transfer(destinationAddress, totalFunds), "Transferencia fallida");
            }
            emit ProposalApproved(destinationAddress, totalFunds);
        }
    }

    // ============ Cancelar ============

    /// @notice Solo el creador puede cancelar si nadie ha votado aún
    function cancel() external onlyOwner nonReentrant {
        require(status == ProposalStatus.VOTING, "No se puede cancelar");
        require(votesYes == 0 && votesNo == 0,   "Ya hay votos");

        status = ProposalStatus.CANCELLED;
        if (totalFunds > 0) {
            require(token.transfer(creator, totalFunds), "Devolucion fallida");
        }
        emit ProposalCancelled(creator);
    }

    // ============ Views ============

    function getInfo() external view returns (
        address _creator,
        string memory _title,
        string memory _description,
        address _destinationAddress,
        uint256 _creationDate,
        uint256 _endDate,
        uint256 _totalFunds,
        bool    _isPrivate,
        ProposalStatus _status,
        uint256 _votesYes,
        uint256 _votesNo
    ) {
        return (
            creator,
            title,
            description,
            destinationAddress,
            creationDate,
            endDate,
            totalFunds,
            isPrivate,
            status,
            votesYes,
            votesNo
        );
    }

    function getVoteOf(address voter) external view returns (bool voted, bool inFavor) {
        return (hasVoted[voter], voteChoice[voter]);
    }
}