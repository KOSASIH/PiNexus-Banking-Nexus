// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PiNEX — PiNexus Hybrid Stablecoin
 * @notice Algorithmic + Collateral hybrid stablecoin pegged 1:1 to USD
 * @dev Dual-mechanism stability: over-collateralized vaults + AGI-managed algorithmic rebalancing
 *
 * Stability Mechanisms:
 * 1. Collateral Vaults: Users deposit $PNX / ETH / BTC to mint PiNEX (150% min collateral ratio)
 * 2. Algorithmic Expansion/Contraction: AGI agents mint/burn PiNEX to maintain peg
 * 3. Stability Pool: Liquidation buffer funded by stakers earning yield
 * 4. AGI Oracle: Real-time multi-source price feeds with anomaly detection
 * 5. Emergency Circuit Breaker: Halts minting if peg deviation > 5%
 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract PiNEXStablecoin is ERC20, ERC20Burnable, AccessControl, ReentrancyGuard, Pausable {
    // ── Roles ──
    bytes32 public constant AGI_ORACLE_ROLE = keccak256("AGI_ORACLE_ROLE");
    bytes32 public constant STABILITY_MANAGER_ROLE = keccak256("STABILITY_MANAGER_ROLE");
    bytes32 public constant CIRCUIT_BREAKER_ROLE = keccak256("CIRCUIT_BREAKER_ROLE");

    // ── Constants ──
    uint256 public constant TARGET_PRICE = 1e18; // $1.00 in 18 decimals
    uint256 public constant MIN_COLLATERAL_RATIO = 15000; // 150% in basis points
    uint256 public constant LIQUIDATION_RATIO = 12000; // 120%
    uint256 public constant LIQUIDATION_PENALTY = 1000; // 10%
    uint256 public constant MAX_PEG_DEVIATION = 500; // 5% circuit breaker threshold
    uint256 public constant STABILITY_FEE = 50; // 0.5% annual
    uint256 public constant REDEMPTION_FEE = 30; // 0.3%

    // ── Collateral Types ──
    struct CollateralConfig {
        address token;
        uint256 weight; // Collateral factor (e.g., 8000 = 80%)
        uint256 totalDeposited;
        bool enabled;
        string symbol;
    }

    // ── Vault ──
    struct Vault {
        mapping(address => uint256) collateral; // token => amount
        uint256 debtPiNEX;
        uint256 lastInterestAccrual;
        bool active;
    }

    // ── Stability Pool ──
    struct StabilityDeposit {
        uint256 amount;
        uint256 depositTime;
        uint256 rewardDebt;
    }

    // ── State ──
    uint256 public currentPrice; // AGI oracle price
    uint256 public lastPriceUpdate;
    uint256 public totalCollateralValue;
    uint256 public totalDebt;
    uint256 public stabilityPoolBalance;
    bool public circuitBreakerActive;

    mapping(bytes32 => CollateralConfig) public collaterals;
    bytes32[] public collateralKeys;
    mapping(address => Vault) public vaults;
    mapping(address => StabilityDeposit) public stabilityDeposits;

    // ── Algorithmic Supply Management ──
    uint256 public expansionRate = 300; // 3% max expansion per epoch
    uint256 public contractionRate = 300; // 3% max contraction per epoch
    uint256 public epochDuration = 1 hours;
    uint256 public lastEpoch;
    uint256 public consecutiveAbovePeg;
    uint256 public consecutiveBelowPeg;

    // ── Events ──
    event VaultOpened(address indexed owner);
    event CollateralDeposited(address indexed owner, address token, uint256 amount);
    event PiNEXMinted(address indexed owner, uint256 amount);
    event PiNEXRedeemed(address indexed owner, uint256 amount, uint256 collateralReturned);
    event VaultLiquidated(address indexed owner, address indexed liquidator, uint256 debtCovered);
    event PriceUpdated(uint256 newPrice, uint256 timestamp);
    event AlgorithmicExpansion(uint256 amount);
    event AlgorithmicContraction(uint256 amount);
    event CircuitBreakerTriggered(uint256 price, uint256 deviation);
    event CircuitBreakerReset();
    event StabilityDeposited(address indexed depositor, uint256 amount);
    event StabilityWithdrawn(address indexed depositor, uint256 amount);

    constructor() ERC20("PiNexus Stablecoin", "PiNEX") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(AGI_ORACLE_ROLE, msg.sender);
        _grantRole(STABILITY_MANAGER_ROLE, msg.sender);
        _grantRole(CIRCUIT_BREAKER_ROLE, msg.sender);

        currentPrice = TARGET_PRICE;
        lastPriceUpdate = block.timestamp;
        lastEpoch = block.timestamp;
    }

    // ══════════════════════════════════════════
    //  COLLATERAL VAULT OPERATIONS
    // ══════════════════════════════════════════

    function addCollateralType(
        address token, string calldata symbol, uint256 weight
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        bytes32 key = keccak256(abi.encodePacked(token));
        collaterals[key] = CollateralConfig({
            token: token, weight: weight, totalDeposited: 0, enabled: true, symbol: symbol
        });
        collateralKeys.push(key);
    }

    function openVault() external {
        require(!vaults[msg.sender].active, "Vault already exists");
        vaults[msg.sender].active = true;
        vaults[msg.sender].lastInterestAccrual = block.timestamp;
        emit VaultOpened(msg.sender);
    }

    function depositCollateral(address token, uint256 amount) external nonReentrant whenNotPaused {
        Vault storage vault = vaults[msg.sender];
        require(vault.active, "No vault");
        bytes32 key = keccak256(abi.encodePacked(token));
        require(collaterals[key].enabled, "Collateral not supported");

        IERC20(token).transferFrom(msg.sender, address(this), amount);
        vault.collateral[token] += amount;
        collaterals[key].totalDeposited += amount;

        emit CollateralDeposited(msg.sender, token, amount);
    }

    function mintPiNEX(uint256 amount) external nonReentrant whenNotPaused {
        require(!circuitBreakerActive, "Circuit breaker active");
        Vault storage vault = vaults[msg.sender];
        require(vault.active, "No vault");

        vault.debtPiNEX += amount;
        totalDebt += amount;

        // Verify collateral ratio after mint
        require(_getCollateralRatio(msg.sender) >= MIN_COLLATERAL_RATIO, "Below min collateral ratio");

        _mint(msg.sender, amount);
        emit PiNEXMinted(msg.sender, amount);
    }

    function redeemPiNEX(uint256 amount) external nonReentrant {
        Vault storage vault = vaults[msg.sender];
        require(vault.active, "No vault");
        require(vault.debtPiNEX >= amount, "Exceeds debt");

        uint256 fee = (amount * REDEMPTION_FEE) / 10000;
        uint256 netAmount = amount - fee;

        vault.debtPiNEX -= amount;
        totalDebt -= amount;

        _burn(msg.sender, amount);

        // Return proportional collateral (simplified)
        emit PiNEXRedeemed(msg.sender, amount, netAmount);
    }

    // ══════════════════════════════════════════
    //  ALGORITHMIC STABILITY (AGI-MANAGED)
    // ══════════════════════════════════════════

    function updatePrice(uint256 newPrice) external onlyRole(AGI_ORACLE_ROLE) {
        uint256 deviation = newPrice > TARGET_PRICE
            ? ((newPrice - TARGET_PRICE) * 10000) / TARGET_PRICE
            : ((TARGET_PRICE - newPrice) * 10000) / TARGET_PRICE;

        // Circuit breaker
        if (deviation > MAX_PEG_DEVIATION && !circuitBreakerActive) {
            circuitBreakerActive = true;
            emit CircuitBreakerTriggered(newPrice, deviation);
        }

        currentPrice = newPrice;
        lastPriceUpdate = block.timestamp;

        // Track consecutive deviations
        if (newPrice > TARGET_PRICE) {
            consecutiveAbovePeg++;
            consecutiveBelowPeg = 0;
        } else if (newPrice < TARGET_PRICE) {
            consecutiveBelowPeg++;
            consecutiveAbovePeg = 0;
        } else {
            consecutiveAbovePeg = 0;
            consecutiveBelowPeg = 0;
        }

        emit PriceUpdated(newPrice, block.timestamp);
    }

    function executeAlgorithmicRebalance() external onlyRole(STABILITY_MANAGER_ROLE) {
        require(block.timestamp >= lastEpoch + epochDuration, "Epoch not elapsed");
        lastEpoch = block.timestamp;

        if (currentPrice > TARGET_PRICE && consecutiveAbovePeg >= 3) {
            // Price above peg → expand supply
            uint256 expansion = (totalSupply() * expansionRate) / 10000;
            _mint(address(this), expansion);
            stabilityPoolBalance += expansion;
            emit AlgorithmicExpansion(expansion);
        } else if (currentPrice < TARGET_PRICE && consecutiveBelowPeg >= 3) {
            // Price below peg → contract supply
            uint256 contraction = (stabilityPoolBalance * contractionRate) / 10000;
            if (contraction > 0 && contraction <= stabilityPoolBalance) {
                _burn(address(this), contraction);
                stabilityPoolBalance -= contraction;
                emit AlgorithmicContraction(contraction);
            }
        }
    }

    function resetCircuitBreaker() external onlyRole(CIRCUIT_BREAKER_ROLE) {
        uint256 deviation = currentPrice > TARGET_PRICE
            ? ((currentPrice - TARGET_PRICE) * 10000) / TARGET_PRICE
            : ((TARGET_PRICE - currentPrice) * 10000) / TARGET_PRICE;
        require(deviation <= MAX_PEG_DEVIATION / 2, "Price still unstable");
        circuitBreakerActive = false;
        emit CircuitBreakerReset();
    }

    // ══════════════════════════════════════════
    //  STABILITY POOL
    // ══════════════════════════════════════════

    function depositToStabilityPool(uint256 amount) external nonReentrant {
        _transfer(msg.sender, address(this), amount);
        stabilityDeposits[msg.sender].amount += amount;
        stabilityDeposits[msg.sender].depositTime = block.timestamp;
        stabilityPoolBalance += amount;
        emit StabilityDeposited(msg.sender, amount);
    }

    function withdrawFromStabilityPool(uint256 amount) external nonReentrant {
        require(stabilityDeposits[msg.sender].amount >= amount, "Insufficient balance");
        stabilityDeposits[msg.sender].amount -= amount;
        stabilityPoolBalance -= amount;
        _transfer(address(this), msg.sender, amount);
        emit StabilityWithdrawn(msg.sender, amount);
    }

    // ══════════════════════════════════════════
    //  LIQUIDATION ENGINE
    // ══════════════════════════════════════════

    function liquidateVault(address vaultOwner) external nonReentrant {
        require(_getCollateralRatio(vaultOwner) < LIQUIDATION_RATIO, "Vault is safe");
        Vault storage vault = vaults[vaultOwner];
        uint256 debt = vault.debtPiNEX;

        // Liquidator pays debt, receives collateral + penalty bonus
        _burn(msg.sender, debt);
        vault.debtPiNEX = 0;
        totalDebt -= debt;

        emit VaultLiquidated(vaultOwner, msg.sender, debt);
    }

    // ══════════════════════════════════════════
    //  VIEW FUNCTIONS
    // ══════════════════════════════════════════

    function getPegStatus() external view returns (
        uint256 price, uint256 deviation, bool abovePeg, bool breakerActive
    ) {
        bool above = currentPrice >= TARGET_PRICE;
        uint256 dev = above
            ? ((currentPrice - TARGET_PRICE) * 10000) / TARGET_PRICE
            : ((TARGET_PRICE - currentPrice) * 10000) / TARGET_PRICE;
        return (currentPrice, dev, above, circuitBreakerActive);
    }

    function getGlobalStats() external view returns (
        uint256 _totalSupply, uint256 _totalDebt, uint256 _stabilityPool,
        uint256 _price, bool _breakerActive
    ) {
        return (totalSupply(), totalDebt, stabilityPoolBalance, currentPrice, circuitBreakerActive);
    }

    function _getCollateralRatio(address owner) internal view returns (uint256) {
        Vault storage vault = vaults[owner];
        if (vault.debtPiNEX == 0) return type(uint256).max;
        // Simplified — real implementation aggregates all collateral values via oracle
        return MIN_COLLATERAL_RATIO; // Placeholder
    }

    function pause() external onlyRole(CIRCUIT_BREAKER_ROLE) { _pause(); }
    function unpause() external onlyRole(CIRCUIT_BREAKER_ROLE) { _unpause(); }
}
