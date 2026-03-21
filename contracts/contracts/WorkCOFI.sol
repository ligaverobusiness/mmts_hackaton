// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IWorkFactoryCOFI.sol";

/// @title WorkCOFI - Contrato de trabajo validado por IA (GenLayer)
/// @notice El cliente deposita USDC. El freelancer entrega. GenLayer valida.
contract WorkCOFI is ReentrancyGuard, Ownable {

    enum WorkStatus {
        OPEN,        // Abierto, esperando freelancer
        SUBMITTED,   // Freelancer entregó, esperando validación IA
        VALIDATING,  // GenLayer está evaluando
        APPROVED,    // IA aprobó — fondos al freelancer
        REJECTED,    // IA rechazó — fondos devueltos al cliente
        CANCELLED    // Cancelado por el cliente (solo si ops = 0)
    }

    address public immutable creator;
    string  public title;
    string  public descriptionPublic;   // Lo que ve el freelancer
    // conditionsIA NO se guarda on-chain — vive en el backend (privado)
    uint256 public immutable creationDate;
    uint256 public immutable endDate;
    address public immutable factory;
    IERC20  public immutable token;

    uint8   public requiredApprovals;   // 3, 4, o 5 de 5
    uint256 public totalBounty;
    bool    public isPrivate;

    WorkStatus public status;
    address public executor;            // Freelancer que reclamó
    string  public deliveryUrl;         // Link/hash entregado
    uint256 public submittedAt;
    uint256 public validationRequestedAt;

    // Resultado de GenLayer
    bool    public isApproved;
    string  public validationSummary;   // Resumen en lenguaje natural

    uint256 private constant VALIDATION_TIMEOUT = 3 days;
    uint256 private constant AUTO_RELEASE_DELAY  = 3 days;

    event WorkCreated(address indexed creator, string title, uint256 bounty);
    event BountyIncreased(uint256 oldAmount, uint256 newAmount);
    event WorkClaimed(address indexed executor);
    event WorkDelivered(address indexed executor, string deliveryUrl);
    event ValidationRequested(address indexed workAddress);
    event WorkApproved(address indexed executor, uint256 amount, string summary);
    event WorkRejected(address indexed creator, uint256 amount, string summary);
    event WorkCancelled(address indexed creator);
    event ResolutionReceived(bool approved, string summary);

    modifier onlyCreator() {
        require(msg.sender == creator, "Solo el creador");
        _;
    }

    modifier onlyFactory() {
        require(msg.sender == factory, "Solo la factory");
        _;
    }

    constructor(
        address _creator,
        string memory _title,
        string memory _descriptionPublic,
        uint256 _endDate,
        address _token,
        address _factory,
        uint8   _requiredApprovals,
        bool    _isPrivate
    ) Ownable(_factory) {
        require(_creator  != address(0), "Creator invalido");
        require(_token    != address(0), "Token invalido");
        require(_factory  != address(0), "Factory invalida");
        require(bytes(_title).length > 0, "Titulo vacio");
        require(_requiredApprovals >= 3 && _requiredApprovals <= 5, "Umbral invalido");
        require(_endDate > block.timestamp, "Fecha invalida");

        creator            = _creator;
        title              = _title;
        descriptionPublic  = _descriptionPublic;
        creationDate       = block.timestamp;
        endDate            = _endDate;
        factory            = _factory;
        token              = IERC20(_token);
        requiredApprovals  = _requiredApprovals;
        isPrivate          = _isPrivate;
        status             = WorkStatus.OPEN;
    }

    // ============ Depósito inicial y adicional ============

    /// @notice Llamado por la factory al crear el contrato
    function depositInitial(uint256 amount) external onlyFactory {
        require(amount > 0, "Monto invalido");
        totalBounty += amount;
        emit WorkCreated(creator, title, totalBounty);
    }

    /// @notice El creador puede aumentar el monto en cualquier momento
    function increaseBounty(uint256 amount) external nonReentrant {
        require(msg.sender == creator, "Solo el creador");
        require(
            status == WorkStatus.OPEN || status == WorkStatus.SUBMITTED,
            "No se puede aumentar en este estado"
        );
        require(amount > 0, "Monto invalido");
        require(
            token.transferFrom(msg.sender, address(this), amount),
            "Transfer fallida"
        );
        uint256 old = totalBounty;
        totalBounty += amount;
        emit BountyIncreased(old, totalBounty);
    }

    // ============ Flujo del freelancer ============

    /// @notice Freelancer entrega el trabajo
    function deliver(string calldata _deliveryUrl) external nonReentrant {
        require(status == WorkStatus.OPEN, "No disponible");
        require(block.timestamp < endDate, "Contrato vencido");
        require(bytes(_deliveryUrl).length > 0, "URL vacia");

        // Si es privado, solo el executor asignado puede entregar
        // (la restricción de executor address se maneja en factory)

        executor     = msg.sender;
        deliveryUrl  = _deliveryUrl;
        submittedAt  = block.timestamp;

        uint8 old = uint8(status);
        status    = WorkStatus.SUBMITTED;

        IWorkFactoryCOFI(factory).notifyStatusChange(old, uint8(status));
        emit WorkDelivered(msg.sender, _deliveryUrl);
    }

    // ============ Validación con GenLayer ============

    /// @notice El creador activa la validación IA tras revisar la entrega
    function requestValidation() external {
        require(msg.sender == creator, "Solo el creador");
        require(status == WorkStatus.SUBMITTED, "Nada que validar");

        uint8 old = uint8(status);
        status    = WorkStatus.VALIDATING;
        validationRequestedAt = block.timestamp;

        IWorkFactoryCOFI(factory).notifyStatusChange(old, uint8(status));
        IWorkFactoryCOFI(factory).forwardToGenLayer(address(this));

        emit ValidationRequested(address(this));
    }

    /// @notice Recibe el resultado de GenLayer via factory/bridge
    function setResolution(bytes calldata _message) external onlyFactory {
        require(status == WorkStatus.VALIDATING, "No en validacion");

        (
            address workAddress,
            bool    approved,
            string memory summary
        ) = abi.decode(_message, (address, bool, string));

        require(workAddress == address(this), "Respuesta incorrecta");

        uint8 old  = uint8(status);
        isApproved = approved;
        validationSummary = summary;

        if (approved) {
            status = WorkStatus.APPROVED;
            // Pagar al freelancer
            require(token.transfer(executor, totalBounty), "Pago fallido");
            emit WorkApproved(executor, totalBounty, summary);
        } else {
            status = WorkStatus.REJECTED;
            // Devolver al creador
            require(token.transfer(creator, totalBounty), "Devolucion fallida");
            emit WorkRejected(creator, totalBounty, summary);
        }

        IWorkFactoryCOFI(factory).notifyStatusChange(old, uint8(status));
        emit ResolutionReceived(approved, summary);
    }

    /// @notice Auto-release si GenLayer no responde en 3 días
    function autoRelease() external nonReentrant {
        require(status == WorkStatus.VALIDATING, "No en validacion");
        require(
            block.timestamp >= validationRequestedAt + VALIDATION_TIMEOUT,
            "Timeout no alcanzado"
        );
        // Timeout: devolver al creador
        uint8 old = uint8(status);
        status    = WorkStatus.REJECTED;
        require(token.transfer(creator, totalBounty), "Devolucion fallida");
        IWorkFactoryCOFI(factory).notifyStatusChange(old, uint8(status));
    }

    // ============ Cancelar ============

    /// @notice Solo si no hay ningún freelancer participando
    function cancel() external onlyCreator nonReentrant {
        require(
            status == WorkStatus.OPEN,
            "Solo se puede cancelar si esta OPEN"
        );
        require(executor == address(0), "Ya hay un ejecutor");

        uint8 old = uint8(status);
        status    = WorkStatus.CANCELLED;
        require(token.transfer(creator, totalBounty), "Devolucion fallida");
        IWorkFactoryCOFI(factory).notifyStatusChange(old, uint8(status));
        emit WorkCancelled(creator);
    }

    // ============ Views ============

    function getInfo() external view returns (
        address  _creator,
        string memory _title,
        string memory _descriptionPublic,
        string memory _deliveryUrl,
        uint256  _creationDate,
        uint256  _endDate,
        uint256  _totalBounty,
        uint8    _requiredApprovals,
        bool     _isPrivate,
        WorkStatus _status,
        address  _executor,
        bool     _isApproved,
        string memory _validationSummary
    ) {
        return (
            creator,
            title,
            descriptionPublic,
            deliveryUrl,
            creationDate,
            endDate,
            totalBounty,
            requiredApprovals,
            isPrivate,
            status,
            executor,
            isApproved,
            validationSummary
        );
    }

    function getStatus() external view returns (WorkStatus) {
        return status;
    }
}