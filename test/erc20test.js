const chai = require("chai");
const { expect } = require("chai")
const { ethers } = require("ethers");
const { solidity } = require("ethereum-waffle");
const deployLib = require("../deployLib")
const config = require('../appconfig.json');

chai.use(solidity);

describe("customERC20", function() {
    let network;
    const delay = 2000;
    //Provider info
    let provider;
    //Accounts info
    let address1, address2, address3;
    let signer1, signer2, signer3;
    //Contract info
    const contractName = "TestToken" + Date.now().toString().slice(-4);
    const tokenName = "TestToken" + Date.now().toString().slice(-4);
    const tokenSymbol = "TST" + Date.now().toString().slice(-4);
    const amount = 1000;
    let sourceCode, configuration, compiledContract;
    let contract;

    before(async function() {
        network = process.env.npm_config_network;
        if (network === "localhost") {
            provider = new ethers.providers.JsonRpcProvider(config.providerUrl);
        } else {
            provider = ethers.getDefaultProvider(network, {etherscan: config.etherscanApiKey});
        }
        signer1 = (network === "localhost") ? provider.getSigner(0) : new ethers.Wallet(config.testPrivateKey1, provider);
        signer2 = (network === "localhost") ? provider.getSigner(1) : new ethers.Wallet(config.testPrivateKey2, provider);
        signer3 = (network === "localhost") ? provider.getSigner(2) : new ethers.Wallet(config.testPrivateKey3, provider);     
        address1 = await signer1.getAddress();
        address2 = await signer2.getAddress();
        address3 = await signer3.getAddress();
      
        sourceCode = deployLib.createERC20SourceCode(contractName, tokenName, tokenSymbol, address2, amount);
        configuration = deployLib.createERC20Configuration(sourceCode);
        compiledContract = deployLib.compileERC20Contract(contractName, configuration);
        contract = await deployLib.deployERC20ContractBySigner(compiledContract, signer1);
        console.log("Contract address: " + contract.address);
    })

    it("should be deployed and have proper address and parameters #1", async function() {
        expect(contract.address).to.be.properAddress
        expect(await contract.name()).to.eq(tokenName);
        expect(await contract.symbol()).to.eq(tokenSymbol);
        expect(await contract.totalSupply()).to.eq(amount);
        expect(await contract.decimals()).to.eq(18);
    })

    it("should have 0 ether by default #2", async function() {
        let contractBalance = await provider.getBalance(contract.address);
        expect(contractBalance).to.eq(0);
    })

    it("should have minted tokens to specified address #3", async function() {
        //function balanceOf(address account) public view virtual override returns (uint256)
        expect(await contract.balanceOf(address1)).to.eq(0);
        expect(await contract.balanceOf(address2)).to.eq(amount);
        expect(await contract.balanceOf(address3)).to.eq(0);
    })

    it("should be able to approve to withdraw tokens and increase/decrease allowance #4", async function() {
        //function approve(address spender, uint256 amount) public virtual override returns (bool)
        //function allowance(address owner, address spender) public view virtual override returns (uint256)
        let testAmount = 200;
        await contract.connect(signer1).approve(address2, testAmount);
        while ((await contract.allowance(address1, address2)) == 0) {
            await new Promise(resolve => setTimeout(resolve, delay))
        }
        expect(await contract.allowance(address1, address2)).to.eq(testAmount);
        testAmount = 300;
        await contract.connect(signer2).approve(address3, testAmount);
        while ((await contract.allowance(address2, address3)) == 0) {
            await new Promise(resolve => setTimeout(resolve, delay))
        }
        expect(await contract.allowance(address2, address3)).to.eq(testAmount);

        //function increaseAllowance(address spender, uint256 addedValue) public virtual returns (bool) {
        //function decreaseAllowance(address spender, uint256 subtractedValue) public virtual returns (bool)
        testAmount = 80;
        let allowanceBefore = Number(await contract.allowance(address1, address2)); 
        await contract.connect(signer1).increaseAllowance(address2, testAmount);
        while ((await contract.allowance(address1, address2)) == allowanceBefore) {
            await new Promise(resolve => setTimeout(resolve, delay))
        }
        expect(await contract.allowance(address1, address2)).to.eq(allowanceBefore + testAmount);
        testAmount = 50;
        allowanceBefore = Number(await contract.allowance(address2, address3));
        await contract.connect(signer2).decreaseAllowance(address3, testAmount);
        while ((await contract.allowance(address2, address3)) == allowanceBefore) {
            await new Promise(resolve => setTimeout(resolve, delay))
        }
        expect(await contract.allowance(address2, address3)).to.eq(allowanceBefore - testAmount);
    })

    it("should be able to transfer tokens between accounts #5", async function() {
        //function transfer(address to, uint256 amount) public virtual override returns (bool)
        let testAmount = 100;
        let balance2 = Number(await contract.balanceOf(address2));
        let balance3 = Number(await contract.balanceOf(address3));
        await contract.connect(signer2).transfer(address3, testAmount);
        while ((await contract.balanceOf(address2) == balance2) && (await contract.balanceOf(address3) == balance3)) {
            await new Promise(resolve => setTimeout(resolve, delay))
        }
        expect(await contract.balanceOf(address2)).to.eq(balance2 - testAmount);
        expect(await contract.balanceOf(address3)).to.eq(balance3 + testAmount);

        testAmount = 50;
        balance2 = Number(await contract.balanceOf(address2));
        balance3 = Number(await contract.balanceOf(address3));
        await contract.connect(signer3).transfer(address2, testAmount);
        while ((await contract.balanceOf(address2) == balance2) && (await contract.balanceOf(address3) == balance3)) {
            await new Promise(resolve => setTimeout(resolve, delay))
        }
        expect(await contract.balanceOf(address2)).to.eq(balance2 + testAmount);
        expect(await contract.balanceOf(address3)).to.eq(balance3 - testAmount);
    })

    it("should generate events with proper args #6", async function() {
        // event Transfer(address indexed _from, address indexed _to, uint _value);
        // event Approval(address indexed _owner, address indexed _spender, uint _value);
        testAmount = 150;
        expect(await contract.connect(signer2).approve(address3, testAmount))
            .to.emit(contract, "Approval")
            .withArgs(address2, address3, testAmount);
        expect(await contract.connect(signer2).transfer(address3, testAmount))
            .to.emit(contract, "Transfer")
            .withArgs(address2, address3, testAmount);
    })

    if ((process.env.npm_config_verify == 1) && (process.env.npm_config_network != "localhost")) {
        it("should be possible to verify deployed contract #7", async function() {
            let url;
            switch (network) {
                case "goerli":
                    url = "https://api-goerli.etherscan.io/api";
                    break;
                case "sepolia":
                    url = "https://api-sepolia.etherscan.io/api";
                    break;
                case "mainnet":
                    url = "https://api.etherscan.io/api";
                    break;
            }
            let compilerVersion = "v" + JSON.parse(compiledContract.metadata).compiler.version;
            let verificationResult = await deployLib.verifyERC20Contract(url, config.etherscanApiKey, sourceCode, contract.address, contractName, compilerVersion);
            while (verificationResult.length != 50) {
                await new Promise(resolve => setTimeout(resolve, delay));
                verificationResult = await deployLib.verifyERC20Contract(url, config.etherscanApiKey, sourceCode, contract.address, contractName, compilerVersion);
            }
            console.log("Verification guid: " + verificationResult);
            expect(verificationResult.length).to.eq(50);
            let responseMessage = await deployLib.checkERC20ContractVerificationStatus(url, config.etherscanApiKey, verificationResult);
            while (responseMessage != "Pass - Verified") {
                await new Promise(resolve => setTimeout(resolve, delay));
                responseMessage = await deployLib.checkERC20ContractVerificationStatus(url, config.etherscanApiKey, verificationResult);
            }
            console.log("Response message: " + responseMessage);
            expect(responseMessage).to.eq("Pass - Verified");
        })
    }

})