// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {PostMint} from "../contracts/PostMint.sol";
import {PostMintFactory} from "../contracts/PostMintFactory.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts with the account:", deployer);
        console.log("Account balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy PostMintFactory
        PostMintFactory factory = new PostMintFactory();
        console.log("PostMintFactory deployed to:", address(factory));

        // Deploy a sample PostMint contract
        PostMint postMint = new PostMint(deployer);
        console.log("Sample PostMint deployed to:", address(postMint));

        vm.stopBroadcast();
        
        // Save deployment addresses
        console.log("=== Deployment Summary ===");
        console.log("PostMintFactory:", address(factory));
        console.log("Sample PostMint:", address(postMint));
        console.log("Deployer:", deployer);
    }
}
