// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PiNexus Staking — Validator Staking and Delegation
 * @notice Stake $PNX to become a validator or delegate to earn rewards
 */

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PNXStaking is Ownable, ReentrancyGuard {
    IERC20 public pnxToken;

    uint256 public constant MIN_VALIDATOR_STAKE = 100_000 * 1e18;
    uint256 public constant MIN_DELEGATION = 100 * 1e18;
    uint256 public constant UNBONDING_PERIOD = 7 days;

    struct ValidatorInfo {
        uint256 selfStake;
        uint256 totalDelegated;
        uint256 commission; // basis points (e.g., 500 = 5%)
        uint256 intelligenceScore;
        bool active;
        uint256 registeredAt;
    }

    struct Delegation {
        address validator;
        uint256 amount;
        uint256 rewardDebt;
        uint256 delegatedAt;
    }

    struct UnbondingEntry {
        uint256 amount;
        uint256 completionTime;
    }

    // State
    mapping(address => ValidatorInfo) public validators;
    mapping(address => Delegation) public delegations;
    mapping(address => UnbondingEntry[]) public unbonding;

    address[] public validatorList;
    uint256 public totalStaked;
    uint256 public rewardPerShare;
    uint256 public totalRewardsDistributed;

    // Events
    event ValidatorRegistered(address indexed validator, uint256 stake, uint256 commission);
    event Delegated(address indexed delegator, address indexed validator, uint256 amount);
    event Undelegated(address indexed delegator, uint256 amount, uint256 completionTime);
    event RewardClaimed(address indexed account, uint256 amount);
    event IntelligenceScoreUpdated(address indexed validator, uint256 score);

    constructor(address _pnxToken) Ownable(msg.sender) {
        pnxToken = IERC20(_pnxToken);
    }

    /**
     * @notice Register as a validator with self-stake
     */
    function registerValidator(uint256 amount, uint256 commission) external nonReentrant {
        require(amount >= MIN_VALIDATOR_STAKE, "Insufficient stake");
        require(commission <= 2000, "Commission too high (max 20%)");
        require(!validators[msg.sender].active, "Already registered");

        pnxToken.transferFrom(msg.sender, address(this), amount);

        validators[msg.sender] = ValidatorInfo({
            selfStake: amount,
            totalDelegated: 0,
            commission: commission,
            intelligenceScore: 0,
            active: true,
            registeredAt: block.timestamp
        });

        validatorList.push(msg.sender);
        totalStaked += amount;

        emit ValidatorRegistered(msg.sender, amount, commission);
    }

    /**
     * @notice Delegate $PNX to a validator
     */
    function delegate(address validator, uint256 amount) external nonReentrant {
        require(validators[validator].active, "Validator not active");
        require(amount >= MIN_DELEGATION, "Below minimum delegation");

        pnxToken.transferFrom(msg.sender, address(this), amount);

        Delegation storage del = delegations[msg.sender];
        del.validator = validator;
        del.amount += amount;
        del.delegatedAt = block.timestamp;

        validators[validator].totalDelegated += amount;
        totalStaked += amount;

        emit Delegated(msg.sender, validator, amount);
    }

    /**
     * @notice Initiate undelegation (subject to unbonding period)
     */
    function undelegate(uint256 amount) external nonReentrant {
        Delegation storage del = delegations[msg.sender];
        require(del.amount >= amount, "Insufficient delegation");

        del.amount -= amount;
        validators[del.validator].totalDelegated -= amount;
        totalStaked -= amount;

        unbonding[msg.sender].push(UnbondingEntry({
            amount: amount,
            completionTime: block.timestamp + UNBONDING_PERIOD
        }));

        emit Undelegated(msg.sender, amount, block.timestamp + UNBONDING_PERIOD);
    }

    /**
     * @notice Withdraw unbonded tokens
     */
    function withdrawUnbonded() external nonReentrant {
        UnbondingEntry[] storage entries = unbonding[msg.sender];
        uint256 totalWithdrawable = 0;
        uint256 i = 0;

        while (i < entries.length) {
            if (entries[i].completionTime <= block.timestamp) {
                totalWithdrawable += entries[i].amount;
                entries[i] = entries[entries.length - 1];
                entries.pop();
            } else {
                i++;
            }
        }

        require(totalWithdrawable > 0, "Nothing to withdraw");
        pnxToken.transfer(msg.sender, totalWithdrawable);
    }

    /**
     * @notice Update validator's intelligence score (called by PoI consensus)
     */
    function updateIntelligenceScore(address validator, uint256 score) external onlyOwner {
        require(validators[validator].active, "Validator not active");
        validators[validator].intelligenceScore = score;
        emit IntelligenceScoreUpdated(validator, score);
    }

    // ── View Functions ──

    function getValidatorCount() external view returns (uint256) {
        return validatorList.length;
    }

    function getValidatorInfo(address validator) external view returns (ValidatorInfo memory) {
        return validators[validator];
    }

    function getDelegation(address delegator) external view returns (Delegation memory) {
        return delegations[delegator];
    }

    function getTotalStaked() external view returns (uint256) {
        return totalStaked;
    }
}
