// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title PostMint
 * @dev Core contract for managing blog posts and their associated Zora coins
 */
contract PostMint is Ownable(msg.sender), ReentrancyGuard {
    struct BlogPost {
        uint256 id;
        string title;
        string content;
        string metadataURI;
        address author;
        address coinAddress;
        uint256 createdAt;
        uint256 totalSupport;
        bool isActive;
    }

    struct Author {
        address authorAddress;
        uint256 totalPosts;
        uint256 totalEarnings;
        uint256 totalSupport;
        bool isVerified;
    }

    // State variables
    mapping(uint256 => BlogPost) public posts;
    mapping(address => Author) public authors;
    mapping(address => uint256[]) public authorPosts;
    mapping(address => mapping(uint256 => uint256)) public userSupport;
    mapping(uint256 => address[]) public postSupporters;
    
    uint256 public nextPostId;
    uint256 public totalPosts;
    uint256 public platformFee = 250; // 2.5% in basis points
    address public feeRecipient;
    
    // Events
    event PostCreated(
        uint256 indexed postId,
        address indexed author,
        string title,
        address coinAddress,
        string metadataURI
    );
    
    event PostSupported(
        uint256 indexed postId,
        address indexed supporter,
        uint256 amount,
        uint256 coinAmount
    );
    
    event AuthorVerified(address indexed author);
    event PlatformFeeUpdated(uint256 newFee);
    event FeeRecipientUpdated(address newRecipient);

    constructor(address _feeRecipient) {
        feeRecipient = _feeRecipient;
        nextPostId = 1;
    }

    /**
     * @dev Register a new blog post with its Zora coin address
     */
    function createPost(
        string memory _title,
        string memory _content,
        string memory _metadataURI,
        address _coinAddress
    ) external {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_content).length > 0, "Content cannot be empty");
        require(_coinAddress != address(0), "Invalid coin address");

        uint256 postId = nextPostId++;
        
        posts[postId] = BlogPost({
            id: postId,
            title: _title,
            content: _content,
            metadataURI: _metadataURI,
            author: msg.sender,
            coinAddress: _coinAddress,
            createdAt: block.timestamp,
            totalSupport: 0,
            isActive: true
        });

        // Update author stats
        if (authors[msg.sender].authorAddress == address(0)) {
            authors[msg.sender] = Author({
                authorAddress: msg.sender,
                totalPosts: 1,
                totalEarnings: 0,
                totalSupport: 0,
                isVerified: false
            });
        } else {
            authors[msg.sender].totalPosts++;
        }

        authorPosts[msg.sender].push(postId);
        totalPosts++;

        emit PostCreated(postId, msg.sender, _title, _coinAddress, _metadataURI);
    }

    /**
     * @dev Support a post by purchasing its associated coin
     */
    function supportPost(uint256 _postId, uint256 _coinAmount) external payable nonReentrant {
        require(posts[_postId].isActive, "Post not found or inactive");
        require(msg.value > 0, "Must send ETH to support");
        require(_coinAmount > 0, "Coin amount must be greater than 0");

        BlogPost storage post = posts[_postId];
        
        // Calculate platform fee
        uint256 fee = (msg.value * platformFee) / 10000;
        uint256 supportAmount = msg.value - fee;

        // Update post support
        post.totalSupport += supportAmount;
        
        // Update user support tracking
        if (userSupport[msg.sender][_postId] == 0) {
            postSupporters[_postId].push(msg.sender);
        }
        userSupport[msg.sender][_postId] += supportAmount;

        // Update author earnings
        authors[post.author].totalEarnings += supportAmount;
        authors[post.author].totalSupport += supportAmount;

        // Transfer platform fee
        if (fee > 0) {
            payable(feeRecipient).transfer(fee);
        }

        // Transfer remaining ETH to author
        payable(post.author).transfer(supportAmount);

        emit PostSupported(_postId, msg.sender, supportAmount, _coinAmount);
    }

    /**
     * @dev Get post details
     */
    function getPost(uint256 _postId) external view returns (BlogPost memory) {
        require(posts[_postId].id != 0, "Post not found");
        return posts[_postId];
    }

    /**
     * @dev Get author details
     */
    function getAuthor(address _author) external view returns (Author memory) {
        return authors[_author];
    }

    /**
     * @dev Get posts by author
     */
    function getPostsByAuthor(address _author) external view returns (uint256[] memory) {
        return authorPosts[_author];
    }

    /**
     * @dev Get post supporters
     */
    function getPostSupporters(uint256 _postId) external view returns (address[] memory) {
        return postSupporters[_postId];
    }

    /**
     * @dev Get user support amount for a post
     */
    function getUserSupport(address _user, uint256 _postId) external view returns (uint256) {
        return userSupport[_user][_postId];
    }

    /**
     * @dev Get recent posts (last 50)
     */
    function getRecentPosts() external view returns (BlogPost[] memory) {
        uint256 count = totalPosts > 50 ? 50 : totalPosts;
        BlogPost[] memory recentPosts = new BlogPost[](count);
        
        uint256 startId = nextPostId > count ? nextPostId - count : 1;
        
        for (uint256 i = 0; i < count; i++) {
            uint256 postId = startId + i;
            if (posts[postId].isActive) {
                recentPosts[i] = posts[postId];
            }
        }
        
        return recentPosts;
    }

    // Admin functions
    function verifyAuthor(address _author) external onlyOwner {
        require(authors[_author].authorAddress != address(0), "Author not found");
        authors[_author].isVerified = true;
        emit AuthorVerified(_author);
    }

    function updatePlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 1000, "Fee cannot exceed 10%");
        platformFee = _newFee;
        emit PlatformFeeUpdated(_newFee);
    }

    function updateFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "Invalid recipient");
        feeRecipient = _newRecipient;
        emit FeeRecipientUpdated(_newRecipient);
    }

    function deactivatePost(uint256 _postId) external onlyOwner {
        require(posts[_postId].id != 0, "Post not found");
        posts[_postId].isActive = false;
    }

    // Emergency functions
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    receive() external payable {}
}
