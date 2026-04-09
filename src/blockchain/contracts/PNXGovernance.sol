// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PiNexus Governance — AGI-Enhanced DAO
 * @notice On-chain governance with quadratic voting and AGI analysis integration
 */

import "@openzeppelin/contracts/access/Ownable.sol";

interface IPNXStaking {
    function getDelegation(address delegator) external view returns (
        address validator, uint256 amount, uint256 rewardDebt, uint256 delegatedAt
    );
    function getValidatorInfo(address validator) external view returns (
        uint256 selfStake, uint256 totalDelegated, uint256 commission,
        uint256 intelligenceScore, bool active, uint256 registeredAt
    );
}

contract PNXGovernance is Ownable {
    IPNXStaking public staking;

    uint256 public constant PROPOSAL_THRESHOLD = 1_000_000 * 1e18; // 1M PNX to propose
    uint256 public constant VOTING_PERIOD = 5 days;
    uint256 public constant DISCUSSION_PERIOD = 7 days;
    uint256 public constant QUORUM_PERCENTAGE = 10; // 10% of total staked

    enum ProposalStatus { Draft, Discussion, Voting, Passed, Rejected, Executed, Cancelled }

    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        string ipfsHash; // Detailed proposal document
        ProposalStatus status;
        uint256 forVotes;       // Quadratic vote weight
        uint256 againstVotes;   // Quadratic vote weight
        uint256 createdAt;
        uint256 discussionEnd;
        uint256 votingEnd;
        bytes executionData;    // Calldata for execution
        address executionTarget;
    }

    struct AGIAnalysis {
        uint256 impactScore;    // 0-100
        uint256 riskLevel;      // 0: low, 1: medium, 2: high
        bool recommendation;    // true: approve, false: reject
        string analysisIPFS;    // Detailed analysis document
        uint256 analyzedAt;
    }

    // State
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => AGIAnalysis) public agiAnalyses;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => uint256)) public voteWeight;

    // Events
    event ProposalCreated(uint256 indexed id, address indexed proposer, string title);
    event AGIAnalysisSubmitted(uint256 indexed proposalId, uint256 impactScore, bool recommendation);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalStatusChanged(uint256 indexed proposalId, ProposalStatus status);

    constructor(address _staking) Ownable(msg.sender) {
        staking = IPNXStaking(_staking);
    }

    /**
     * @notice Create a new governance proposal
     */
    function createProposal(
        string calldata title,
        string calldata description,
        string calldata ipfsHash,
        address executionTarget,
        bytes calldata executionData
    ) external returns (uint256) {
        // Verify proposer has enough stake
        (, uint256 amount,,) = staking.getDelegation(msg.sender);
        (uint256 selfStake,,,,,) = staking.getValidatorInfo(msg.sender);
        require(amount + selfStake >= PROPOSAL_THRESHOLD, "Insufficient stake to propose");

        proposalCount++;
        uint256 id = proposalCount;

        proposals[id] = Proposal({
            id: id,
            proposer: msg.sender,
            title: title,
            description: description,
            ipfsHash: ipfsHash,
            status: ProposalStatus.Discussion,
            forVotes: 0,
            againstVotes: 0,
            createdAt: block.timestamp,
            discussionEnd: block.timestamp + DISCUSSION_PERIOD,
            votingEnd: block.timestamp + DISCUSSION_PERIOD + VOTING_PERIOD,
            executionData: executionData,
            executionTarget: executionTarget
        });

        emit ProposalCreated(id, msg.sender, title);
        return id;
    }

    /**
     * @notice Submit AGI analysis for a proposal (called by AGI oracle)
     */
    function submitAGIAnalysis(
        uint256 proposalId,
        uint256 impactScore,
        uint256 riskLevel,
        bool recommendation,
        string calldata analysisIPFS
    ) external onlyOwner {
        require(proposals[proposalId].id > 0, "Proposal does not exist");
        require(impactScore <= 100, "Invalid impact score");
        require(riskLevel <= 2, "Invalid risk level");

        agiAnalyses[proposalId] = AGIAnalysis({
            impactScore: impactScore,
            riskLevel: riskLevel,
            recommendation: recommendation,
            analysisIPFS: analysisIPFS,
            analyzedAt: block.timestamp
        });

        emit AGIAnalysisSubmitted(proposalId, impactScore, recommendation);
    }

    /**
     * @notice Cast a quadratic vote on a proposal
     */
    function vote(uint256 proposalId, bool support) external {
        Proposal storage prop = proposals[proposalId];
        require(prop.status == ProposalStatus.Discussion || prop.status == ProposalStatus.Voting, "Not votable");
        require(block.timestamp >= prop.discussionEnd, "Discussion period active");
        require(block.timestamp <= prop.votingEnd, "Voting ended");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        // Update status to Voting if needed
        if (prop.status == ProposalStatus.Discussion) {
            prop.status = ProposalStatus.Voting;
            emit ProposalStatusChanged(proposalId, ProposalStatus.Voting);
        }

        // Get voter's stake (quadratic voting: weight = sqrt(stake))
        (, uint256 amount,,) = staking.getDelegation(msg.sender);
        (uint256 selfStake,,,,,) = staking.getValidatorInfo(msg.sender);
        uint256 totalStake = amount + selfStake;
        require(totalStake > 0, "No stake");

        uint256 weight = sqrt(totalStake / 1e18); // Quadratic weight

        hasVoted[proposalId][msg.sender] = true;
        voteWeight[proposalId][msg.sender] = weight;

        if (support) {
            prop.forVotes += weight;
        } else {
            prop.againstVotes += weight;
        }

        emit VoteCast(proposalId, msg.sender, support, weight);
    }

    /**
     * @notice Execute a passed proposal
     */
    function executeProposal(uint256 proposalId) external {
        Proposal storage prop = proposals[proposalId];
        require(block.timestamp > prop.votingEnd, "Voting not ended");
        require(prop.status == ProposalStatus.Voting, "Not in voting status");
        require(prop.forVotes > prop.againstVotes, "Proposal not passed");

        prop.status = ProposalStatus.Passed;

        if (prop.executionTarget != address(0)) {
            (bool success,) = prop.executionTarget.call(prop.executionData);
            require(success, "Execution failed");
            prop.status = ProposalStatus.Executed;
        }

        emit ProposalExecuted(proposalId);
        emit ProposalStatusChanged(proposalId, prop.status);
    }

    // ── View Functions ──

    function getProposal(uint256 id) external view returns (Proposal memory) {
        return proposals[id];
    }

    function getAGIAnalysis(uint256 id) external view returns (AGIAnalysis memory) {
        return agiAnalyses[id];
    }

    // ── Internal ──

    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }
}
