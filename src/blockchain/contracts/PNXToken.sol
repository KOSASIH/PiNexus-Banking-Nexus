// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PNX Token — The Intelligence Fuel
 * @notice ERC-20 token with 1% transaction tax (burn + AGI fund + staker rewards + treasury)
 * @dev Deflationary token with AGI buyback mechanism
 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PNXToken is ERC20, ERC20Burnable, Ownable, ReentrancyGuard {
    // ── Constants ──
    uint256 public constant TOTAL_SUPPLY = 100_000_000_000_000 * 1e18; // 100 Trillion
    uint256 public constant TAX_RATE = 100; // 1% (basis points: 100/10000)
    uint256 public constant BURN_SHARE = 40;    // 40% of tax
    uint256 public constant AGI_SHARE = 30;     // 30% of tax
    uint256 public constant STAKER_SHARE = 20;  // 20% of tax
    uint256 public constant TREASURY_SHARE = 10; // 10% of tax

    // ── State ──
    address public agiFund;
    address public stakerRewards;
    address public treasury;
    uint256 public totalBurned;
    uint256 public totalTaxCollected;

    mapping(address => bool) public taxExempt;

    // ── Events ──
    event TaxCollected(address indexed from, uint256 amount, uint256 burned, uint256 agiShare, uint256 stakerShare, uint256 treasuryShare);
    event TaxExemptionUpdated(address indexed account, bool exempt);
    event FundAddressUpdated(string fundType, address newAddress);

    constructor(
        address _agiFund,
        address _stakerRewards,
        address _treasury
    ) ERC20("PiNexus Token", "PNX") Ownable(msg.sender) {
        require(_agiFund != address(0), "Invalid AGI fund address");
        require(_stakerRewards != address(0), "Invalid staker rewards address");
        require(_treasury != address(0), "Invalid treasury address");

        agiFund = _agiFund;
        stakerRewards = _stakerRewards;
        treasury = _treasury;

        // Exempt fund addresses from tax
        taxExempt[_agiFund] = true;
        taxExempt[_stakerRewards] = true;
        taxExempt[_treasury] = true;
        taxExempt[msg.sender] = true;

        // Mint total supply to deployer for distribution
        _mint(msg.sender, TOTAL_SUPPLY);
    }

    /**
     * @notice Override transfer to apply 1% tax
     */
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        if (from == address(0) || to == address(0) || taxExempt[from] || taxExempt[to]) {
            super._update(from, to, amount);
            return;
        }

        uint256 taxAmount = (amount * TAX_RATE) / 10000;
        uint256 transferAmount = amount - taxAmount;

        if (taxAmount > 0) {
            uint256 burnAmount = (taxAmount * BURN_SHARE) / 100;
            uint256 agiAmount = (taxAmount * AGI_SHARE) / 100;
            uint256 stakerAmount = (taxAmount * STAKER_SHARE) / 100;
            uint256 treasuryAmount = taxAmount - burnAmount - agiAmount - stakerAmount;

            // Burn
            super._update(from, address(0), burnAmount);
            totalBurned += burnAmount;

            // Distribute
            super._update(from, agiFund, agiAmount);
            super._update(from, stakerRewards, stakerAmount);
            super._update(from, treasury, treasuryAmount);

            totalTaxCollected += taxAmount;

            emit TaxCollected(from, taxAmount, burnAmount, agiAmount, stakerAmount, treasuryAmount);
        }

        super._update(from, to, transferAmount);
    }

    // ── Admin Functions ──

    function setTaxExempt(address account, bool exempt) external onlyOwner {
        taxExempt[account] = exempt;
        emit TaxExemptionUpdated(account, exempt);
    }

    function setAgiFund(address _agiFund) external onlyOwner {
        require(_agiFund != address(0), "Invalid address");
        agiFund = _agiFund;
        emit FundAddressUpdated("agiFund", _agiFund);
    }

    function setStakerRewards(address _stakerRewards) external onlyOwner {
        require(_stakerRewards != address(0), "Invalid address");
        stakerRewards = _stakerRewards;
        emit FundAddressUpdated("stakerRewards", _stakerRewards);
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid address");
        treasury = _treasury;
        emit FundAddressUpdated("treasury", _treasury);
    }

    // ── View Functions ──

    function circulatingSupply() external view returns (uint256) {
        return totalSupply(); // totalSupply already excludes burned tokens
    }

    function getTokenomics() external view returns (
        uint256 _totalSupply,
        uint256 _totalBurned,
        uint256 _totalTaxCollected,
        uint256 _circulatingSupply
    ) {
        return (TOTAL_SUPPLY, totalBurned, totalTaxCollected, totalSupply());
    }
}
