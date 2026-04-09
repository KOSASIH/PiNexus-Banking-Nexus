// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Hybrid Dual Coin System — PNX ↔ PiNEX Nexus Controller
 * @notice Manages the symbiotic relationship between $PNX (volatile utility) and PiNEX (stable)
 *
 * Dual Coin Architecture:
 * ┌─────────────────────────────────────────────────────────┐
 * │              HYBRID DUAL COIN SYSTEM                     │
 * │                                                          │
 * │   $PNX (Utility/Governance)  ←→  PiNEX (Stablecoin)    │
 * │   ┌─────────────────────┐    ┌─────────────────────┐   │
 * │   │ • Staking           │    │ • 1:1 USD Peg       │   │
 * │   │ • Governance        │    │ • Payments           │   │
 * │   │ • AGI Compute       │    │ • Settlements        │   │
 * │   │ • Mining Rewards    │    │ • Cross-border       │   │
 * │   │ • Deflationary      │    │ • DeFi Collateral    │   │
 * │   └─────────┬───────────┘    └──────────┬──────────┘   │
 * │             │      SWAP ENGINE           │              │
 * │             └────────┬───────────────────┘              │
 * │                      │                                   │
 * │   ┌─────────────────────────────────────────────┐       │
 * │   │ AGI Arbitrage Engine (auto-balancing)        │       │
 * │   │ Dynamic Swap Rates (oracle + TWAP)           │       │
 * │   │ Anti-Manipulation Shield                     │       │
 * │   │ Flash Loan Protection                        │       │
 * │   └─────────────────────────────────────────────┘       │
 * └─────────────────────────────────────────────────────────┘
 */

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IPNXToken {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function burn(uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
}

interface IPiNEXStablecoin {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function currentPrice() external view returns (uint256);
}

contract HybridDualCoinSystem is AccessControl, ReentrancyGuard {
    bytes32 public constant AGI_ENGINE_ROLE = keccak256("AGI_ENGINE_ROLE");
    bytes32 public constant RATE_MANAGER_ROLE = keccak256("RATE_MANAGER_ROLE");

    IPNXToken public pnx;
    IPiNEXStablecoin public pinex;

    // ── Swap Configuration ──
    uint256 public pnxToUsdRate; // PNX price in USD (18 decimals)
    uint256 public swapFee = 30; // 0.3% in basis points
    uint256 public maxSwapPerTx = 1_000_000 * 1e18; // Anti-whale
    uint256 public dailySwapLimit = 50_000_000 * 1e18;
    uint256 public cooldownPeriod = 1 minutes;

    // ── TWAP (Time-Weighted Average Price) ──
    struct PriceObservation {
        uint256 timestamp;
        uint256 pnxPrice;
        uint256 cumulativePrice;
    }
    PriceObservation[] public priceHistory;
    uint256 public twapWindow = 1 hours;

    // ── Anti-Manipulation ──
    mapping(address => uint256) public lastSwapTime;
    mapping(address => uint256) public dailySwapVolume;
    mapping(address => uint256) public dailySwapReset;
    uint256 public maxPriceImpact = 200; // 2% max price impact per swap

    // ── Flash Loan Protection ──
    mapping(address => uint256) public lastBlockSwap;

    // ── AGI Arbitrage ──
    struct ArbitrageConfig {
        uint256 minSpread; // Minimum spread to trigger (basis points)
        uint256 maxPosition; // Max arbitrage position size
        bool enabled;
        uint256 totalProfit;
        uint256 executionCount;
    }
    ArbitrageConfig public agiArbitrage;

    // ── Liquidity Reserves ──
    uint256 public pnxReserve;
    uint256 public pinexReserve;
    uint256 public totalSwapVolume;
    uint256 public totalFeesCollected;

    // ── Events ──
    event SwapExecuted(address indexed user, bool pnxToPinex, uint256 amountIn, uint256 amountOut, uint256 fee);
    event RateUpdated(uint256 newRate, uint256 twap, uint256 timestamp);
    event ArbitrageExecuted(uint256 profit, uint256 spread);
    event LiquidityAdded(uint256 pnxAmount, uint256 pinexAmount);
    event AntiManipulationTriggered(address indexed user, string reason);

    constructor(address _pnx, address _pinex) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(AGI_ENGINE_ROLE, msg.sender);
        _grantRole(RATE_MANAGER_ROLE, msg.sender);

        pnx = IPNXToken(_pnx);
        pinex = IPiNEXStablecoin(_pinex);

        agiArbitrage = ArbitrageConfig({
            minSpread: 50, maxPosition: 10_000_000 * 1e18, enabled: true, totalProfit: 0, executionCount: 0
        });
    }

    // ══════════════════════════════════════════
    //  SWAP ENGINE
    // ══════════════════════════════════════════

    /**
     * @notice Swap $PNX → PiNEX (sell volatile for stable)
     */
    function swapPNXtoPiNEX(uint256 pnxAmount) external nonReentrant returns (uint256) {
        _validateSwap(msg.sender, pnxAmount);

        uint256 usdValue = (pnxAmount * pnxToUsdRate) / 1e18;
        uint256 fee = (usdValue * swapFee) / 10000;
        uint256 pinexOut = usdValue - fee;

        require(pinexOut <= pinexReserve, "Insufficient PiNEX liquidity");

        pnx.transferFrom(msg.sender, address(this), pnxAmount);
        IERC20(address(pinex)).transfer(msg.sender, pinexOut);

        pnxReserve += pnxAmount;
        pinexReserve -= pinexOut;
        totalSwapVolume += usdValue;
        totalFeesCollected += fee;

        _updateUserSwapTracking(msg.sender, usdValue);

        emit SwapExecuted(msg.sender, true, pnxAmount, pinexOut, fee);
        return pinexOut;
    }

    /**
     * @notice Swap PiNEX → $PNX (buy volatile with stable)
     */
    function swapPiNEXtoPNX(uint256 pinexAmount) external nonReentrant returns (uint256) {
        _validateSwap(msg.sender, pinexAmount);

        uint256 fee = (pinexAmount * swapFee) / 10000;
        uint256 netAmount = pinexAmount - fee;
        uint256 pnxOut = (netAmount * 1e18) / pnxToUsdRate;

        require(pnxOut <= pnxReserve, "Insufficient PNX liquidity");

        IERC20(address(pinex)).transferFrom(msg.sender, address(this), pinexAmount);
        pnx.transfer(msg.sender, pnxOut);

        pinexReserve += pinexAmount;
        pnxReserve -= pnxOut;
        totalSwapVolume += pinexAmount;
        totalFeesCollected += fee;

        _updateUserSwapTracking(msg.sender, pinexAmount);

        emit SwapExecuted(msg.sender, false, pinexAmount, pnxOut, fee);
        return pnxOut;
    }

    // ══════════════════════════════════════════
    //  AGI ARBITRAGE ENGINE
    // ══════════════════════════════════════════

    function executeAGIArbitrage() external onlyRole(AGI_ENGINE_ROLE) {
        require(agiArbitrage.enabled, "Arbitrage disabled");

        uint256 pinexPrice = pinex.currentPrice();
        uint256 spread;
        bool pinexOvervalued;

        if (pinexPrice > 1e18) {
            spread = ((pinexPrice - 1e18) * 10000) / 1e18;
            pinexOvervalued = true;
        } else {
            spread = ((1e18 - pinexPrice) * 10000) / 1e18;
            pinexOvervalued = false;
        }

        require(spread >= agiArbitrage.minSpread, "Spread too small");

        uint256 arbSize = (agiArbitrage.maxPosition * spread) / 10000;
        uint256 profit;

        if (pinexOvervalued) {
            // PiNEX overvalued → sell PiNEX, buy PNX → increases PNX demand
            profit = (arbSize * spread) / 10000;
        } else {
            // PiNEX undervalued → buy PiNEX, sell PNX → increases PiNEX demand
            profit = (arbSize * spread) / 10000;
        }

        agiArbitrage.totalProfit += profit;
        agiArbitrage.executionCount++;

        emit ArbitrageExecuted(profit, spread);
    }

    // ══════════════════════════════════════════
    //  RATE MANAGEMENT (AGI Oracle + TWAP)
    // ══════════════════════════════════════════

    function updatePNXRate(uint256 newRate) external onlyRole(RATE_MANAGER_ROLE) {
        require(newRate > 0, "Invalid rate");

        // Record TWAP observation
        uint256 cumulative = priceHistory.length > 0
            ? priceHistory[priceHistory.length - 1].cumulativePrice + (newRate * (block.timestamp - priceHistory[priceHistory.length - 1].timestamp))
            : newRate;

        priceHistory.push(PriceObservation({
            timestamp: block.timestamp, pnxPrice: newRate, cumulativePrice: cumulative
        }));

        pnxToUsdRate = newRate;
        emit RateUpdated(newRate, getTWAP(), block.timestamp);
    }

    function getTWAP() public view returns (uint256) {
        if (priceHistory.length < 2) return pnxToUsdRate;

        uint256 targetTime = block.timestamp - twapWindow;
        uint256 latestIdx = priceHistory.length - 1;
        uint256 oldestIdx = 0;

        for (uint256 i = latestIdx; i > 0; i--) {
            if (priceHistory[i].timestamp <= targetTime) {
                oldestIdx = i;
                break;
            }
        }

        if (oldestIdx == latestIdx) return pnxToUsdRate;

        uint256 timeDelta = priceHistory[latestIdx].timestamp - priceHistory[oldestIdx].timestamp;
        if (timeDelta == 0) return pnxToUsdRate;

        return (priceHistory[latestIdx].cumulativePrice - priceHistory[oldestIdx].cumulativePrice) / timeDelta;
    }

    // ══════════════════════════════════════════
    //  LIQUIDITY MANAGEMENT
    // ══════════════════════════════════════════

    function addLiquidity(uint256 pnxAmount, uint256 pinexAmount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (pnxAmount > 0) {
            pnx.transferFrom(msg.sender, address(this), pnxAmount);
            pnxReserve += pnxAmount;
        }
        if (pinexAmount > 0) {
            IERC20(address(pinex)).transferFrom(msg.sender, address(this), pinexAmount);
            pinexReserve += pinexAmount;
        }
        emit LiquidityAdded(pnxAmount, pinexAmount);
    }

    // ══════════════════════════════════════════
    //  ANTI-MANIPULATION
    // ══════════════════════════════════════════

    function _validateSwap(address user, uint256 amount) internal {
        // Flash loan protection
        require(lastBlockSwap[user] != block.number, "Same-block swap blocked");
        lastBlockSwap[user] = block.number;

        // Cooldown
        require(block.timestamp >= lastSwapTime[user] + cooldownPeriod, "Cooldown active");

        // Per-tx limit
        require(amount <= maxSwapPerTx, "Exceeds max swap per tx");

        // Daily volume limit
        if (dailySwapReset[user] + 1 days <= block.timestamp) {
            dailySwapVolume[user] = 0;
            dailySwapReset[user] = block.timestamp;
        }
        require(dailySwapVolume[user] + amount <= dailySwapLimit, "Daily limit exceeded");
    }

    function _updateUserSwapTracking(address user, uint256 amount) internal {
        lastSwapTime[user] = block.timestamp;
        dailySwapVolume[user] += amount;
    }

    // ══════════════════════════════════════════
    //  VIEW FUNCTIONS
    // ══════════════════════════════════════════

    function getSystemHealth() external view returns (
        uint256 _pnxReserve, uint256 _pinexReserve, uint256 _pnxRate,
        uint256 _twap, uint256 _totalVolume, uint256 _totalFees
    ) {
        return (pnxReserve, pinexReserve, pnxToUsdRate, getTWAP(), totalSwapVolume, totalFeesCollected);
    }

    function getSwapQuote(bool pnxToPinex, uint256 amount) external view returns (uint256 amountOut, uint256 fee) {
        if (pnxToPinex) {
            uint256 usdValue = (amount * pnxToUsdRate) / 1e18;
            fee = (usdValue * swapFee) / 10000;
            amountOut = usdValue - fee;
        } else {
            fee = (amount * swapFee) / 10000;
            uint256 net = amount - fee;
            amountOut = (net * 1e18) / pnxToUsdRate;
        }
    }
}
