import config from './appconfig.json';
const ethers = require('ethers')
const solc = require('solc');
const path = require('path');
const fs = require('fs-extra');
const axios = require('axios').default;
const { execSync } = require('child_process');

const Providers = {Localhost: 'localhost', Mainnet: 'mainnet', Sepolia: 'sepolia', Goerli: "goerli"};

/**
 * Creates flattened contract source code with input parameters
 * @param contractName
 * @param tokenName
 * @param tokenSymbol
 * @param address address to mint tokens
 * @param amount amount of tokens to mint
 * @returns {string}
 */
function createERC20SourceCode(contractName: string, tokenName: string, tokenSymbol: string, address: string, amount: number)
{
    let sourceCode: string =
    "// SPDX-License-Identifier: MIT\n" +
    "pragma solidity >=0.7.0 <0.9.0;\n" +
    "import \"@openzeppelin/contracts/token/ERC20/ERC20.sol\";\n" +
    `contract ${contractName} is ERC20 {\n` +
        `\tconstructor() ERC20(\"${tokenName}\", \"${tokenSymbol}\") {\n` +
            `\t\t_mint(${address}, ${amount});\n` +
        "\t}\n" +
    "}";

    //Write source code to file to use flattener
    fs.writeFileSync('./contracts/customERC20.sol', sourceCode, (err: any) => {
        if (err) {
            console.log(err);
        }
    });

    //Write flattened source code to file
    execSync("./node_modules/.bin/poa-solidity-flattener ./contracts/customERC20.sol")//, 

    sourceCode = fs.readFileSync("./out/customERC20_flat.sol", "utf8");
    return sourceCode;
}

/**
 * Creates configuration to compiler
 * @param sourceCode
 * @returns {*}
 */
function createERC20Configuration(sourceCode: string) {
    return {
        language: 'Solidity',
        sources: {
            'customErc20': {
                content: sourceCode
            },
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['*']
                }
            }
        }
    };
}

function findImports(relativePath: any) {
    const absolutePath = path.resolve('node_modules', relativePath);
    const source = fs.readFileSync(absolutePath, 'utf8');
    return { contents: source };
}

/**
 * Compiles the sources
 * @param contractName
 * @param configuration
 * @returns {*}
 */
function compileERC20Contract(contractName: string, configuration: any) {
    var compiledContracts =
        JSON.parse(solc.compile(JSON.stringify(configuration), {import: findImports})).contracts;
    return compiledContracts['customErc20'][contractName];
}

/**
 * Deploys the contract by private key and returtns the address
 * @param compiledContract
 * @param providerName network name for provider from enum "Providers"
 * @param privateKey
 * @param apiKey etherscan API Key
 * @returns {} deployed contract
 */
async function deployERC20ContractByPrivateKey(compiledContract: any, providerName: string, privateKey: string,  apiKey: string) {
    if (providerName === Providers.Localhost) {
        var provider = new ethers.providers.JsonRpcProvider(config.providerUrl);
    } else {
        var provider = ethers.getDefaultProvider(providerName, {etherscan: apiKey});
    }
    var wallet = new ethers.Wallet(privateKey, provider);
    return deployERC20ContractBySigner(compiledContract, wallet);
}

/**
 * Deploys the contract by signer and returtns the address
 * @param compiledContract
 * @param signer
 * @returns {} deployed contract
 */
async function deployERC20ContractBySigner(compiledContract: any, signer: any) {
    var abi = compiledContract.abi;
    var bytecode = compiledContract.evm.bytecode.object;
    var factory = new ethers.ContractFactory(abi, bytecode, signer);
    var contract = await factory.deploy();
    await contract.deployed();
    return contract;
}

/**
 * Verifies the contract
 * @param url ulr to API request
 * @param apiKey etherscan API Key
 * @param sourceCode
 * @param contractAddress
 * @param contractName
 * @param compilerVersion
 * @returns {string} guid for successfull verification or error message
 */
async function verifyERC20Contract(url: string, apiKey: string, sourceCode: string, contractAddress: string, contractName: string, compilerVersion: string) {
    var data = new URLSearchParams({
        "apikey": apiKey,
        "module": "contract",
        "action": "verifysourcecode",
        "sourceCode": sourceCode,
        "contractaddress": contractAddress,
        "codeformat": "solidity-single-file",
        "contractname": contractName,
        "compilerVersion": compilerVersion,
        "optimizationused": "0",
        "licenseType": "3"
    });
    var result = await axios.post(url, data);
    return result.data.result;
}

/**
 * Checks contract verification status
 * @param url ulr to API request
 * @param apiKey etherscan API Key
 * @param guid 50 character guid string
 * @returns {string} response message
 */
async function checkERC20ContractVerificationStatus(url: string, apiKey: string, guid: string) {
    var data = new URLSearchParams({
        "apikey": apiKey,
        "guid": guid,
        "module": "contract",
        "action": "checkverifystatus",
    });
    var result = await axios.post(url, data);
    return result.data.result;
}

/**
 * Deploys and verifies the contract
 * @param contractName
 * @param tokenName
 * @param tokenSymbol
 * @param address address to mint tokens
 * @param amount amount of tokens to mint
 * @param providerName network name for provider from enum "Providers"
 * @param url ulr to API request
 * @param apiKey etherscan API Key
 * @param privateKey
 */
async function deployAndVerifyContract(
    contractName: string, 
    tokenName: string, 
    tokenSymbol: string, 
    address: string,
    amount: number,
    providerName: string,
    url: string,
    apiKey: string,
    privateKey: string) {

        address = ethers.utils.getAddress(address); // Injects the checksum (via upper-casing specific letters)
        var sourceCode = createERC20SourceCode(contractName, tokenName, tokenSymbol, address, amount);
        var configuration = createERC20Configuration(sourceCode);
        var compiledContract = compileERC20Contract(contractName, configuration);
        var compilerVersion: string = "v" + JSON.parse(compiledContract.metadata).compiler.version;

        var contract = await deployERC20ContractByPrivateKey(compiledContract, providerName, privateKey, apiKey);
        console.log("Successfully deployed, contract address: " + contract.address);

        await new Promise(resolve => setTimeout(resolve, 10000));
        var verificationResult: string = await verifyERC20Contract(url, apiKey, sourceCode, contract.address, contractName, compilerVersion);
        while (verificationResult.length != 50) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            verificationResult = await verifyERC20Contract(url, apiKey, sourceCode, contract.address, contractName, compilerVersion);
        }
        console.log("Verification guid: " + verificationResult);
}

module.exports = 
    { createERC20SourceCode, createERC20Configuration, compileERC20Contract, 
        deployERC20ContractByPrivateKey, deployERC20ContractBySigner, verifyERC20Contract, 
        checkERC20ContractVerificationStatus, deployAndVerifyContract, Providers
    };

// For test
// var contractName: string = "TestToken_XYZ";
// var tokenName: string = "TEST_XYZ";
// var tokenSymbol: string = "TSTXYZ";
// var address: string = config.addressToMint;
// var amount: number = 1000000000;
// var url = "https://api-goerli.etherscan.io/api"; // API for goerli
// var apiKey = config.etherscanApiKey;
// var privateKey = config.privateKeyToDeploy;

// deployAndVerifyContract(
//     contractName,
//     tokenName, 
//     tokenSymbol,
//     address, 
//     amount,
//     Providers.Rinkeby,
//     url,
//     apiKey,
//     privateKey);