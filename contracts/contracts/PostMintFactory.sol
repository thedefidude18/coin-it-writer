// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "./PostMint.sol";

/**
 * @title PostMintFactory
 * @dev Factory contract for deploying PostMint instances
 */
contract PostMintFactory is Ownable(msg.sender) {
    struct PostMintInstance {
        address contractAddress;
        address creator;
        string name;
        uint256 createdAt;
        bool isActive;
    }

    mapping(uint256 => PostMintInstance) public instances;
    mapping(address => uint256[]) public creatorInstances;
    mapping(address => bool) public isPostMintContract;
    
    uint256 public nextInstanceId;
    uint256 public totalInstances;
    uint256 public deploymentFee = 0.001 ether;
    
    event PostMintDeployed(
        uint256 indexed instanceId,
        address indexed contractAddress,
        address indexed creator,
        string name
    );
    
    event DeploymentFeeUpdated(uint256 newFee);

    constructor() {
        nextInstanceId = 1;
    }

    /**
     * @dev Deploy a new PostMint contract instance
     */
    function deployPostMint(
        string memory _name,
        address _feeRecipient
    ) external payable returns (address) {
        require(msg.value >= deploymentFee, "Insufficient deployment fee");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(_feeRecipient != address(0), "Invalid fee recipient");

        // Deploy new PostMint contract
        PostMint newPostMint = new PostMint(_feeRecipient);
        address contractAddress = address(newPostMint);

        // Transfer ownership to creator
        newPostMint.transferOwnership(msg.sender);

        // Record the instance
        uint256 instanceId = nextInstanceId++;
        instances[instanceId] = PostMintInstance({
            contractAddress: contractAddress,
            creator: msg.sender,
            name: _name,
            createdAt: block.timestamp,
            isActive: true
        });

        creatorInstances[msg.sender].push(instanceId);
        isPostMintContract[contractAddress] = true;
        totalInstances++;

        // Refund excess payment
        if (msg.value > deploymentFee) {
            payable(msg.sender).transfer(msg.value - deploymentFee);
        }

        emit PostMintDeployed(instanceId, contractAddress, msg.sender, _name);
        return contractAddress;
    }

    /**
     * @dev Get instance details
     */
    function getInstance(uint256 _instanceId) external view returns (PostMintInstance memory) {
        require(instances[_instanceId].contractAddress != address(0), "Instance not found");
        return instances[_instanceId];
    }

    /**
     * @dev Get instances by creator
     */
    function getInstancesByCreator(address _creator) external view returns (uint256[] memory) {
        return creatorInstances[_creator];
    }

    /**
     * @dev Get recent instances
     */
    function getRecentInstances() external view returns (PostMintInstance[] memory) {
        uint256 count = totalInstances > 20 ? 20 : totalInstances;
        PostMintInstance[] memory recentInstances = new PostMintInstance[](count);
        
        uint256 startId = nextInstanceId > count ? nextInstanceId - count : 1;
        
        for (uint256 i = 0; i < count; i++) {
            uint256 instanceId = startId + i;
            if (instances[instanceId].isActive) {
                recentInstances[i] = instances[instanceId];
            }
        }
        
        return recentInstances;
    }

    // Admin functions
    function updateDeploymentFee(uint256 _newFee) external onlyOwner {
        deploymentFee = _newFee;
        emit DeploymentFeeUpdated(_newFee);
    }

    function deactivateInstance(uint256 _instanceId) external onlyOwner {
        require(instances[_instanceId].contractAddress != address(0), "Instance not found");
        instances[_instanceId].isActive = false;
    }

    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    receive() external payable {}
}
