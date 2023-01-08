"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var appconfig_json_1 = __importDefault(require("./appconfig.json"));
var ethers = require('ethers');
var solc = require('solc');
var path = require('path');
var fs = require('fs-extra');
var axios = require('axios')["default"];
var execSync = require('child_process').execSync;
var Providers = { Localhost: 'localhost', Mainnet: 'mainnet', Sepolia: 'sepolia', Goerli: "goerli" };
/**
 * Creates flattened contract source code with input parameters
 * @param contractName
 * @param tokenName
 * @param tokenSymbol
 * @param address address to mint tokens
 * @param amount amount of tokens to mint
 * @returns {string}
 */
function createERC20SourceCode(contractName, tokenName, tokenSymbol, address, amount) {
    var sourceCode = "// SPDX-License-Identifier: MIT\n" +
        "pragma solidity >=0.7.0 <0.9.0;\n" +
        "import \"@openzeppelin/contracts/token/ERC20/ERC20.sol\";\n" +
        "contract ".concat(contractName, " is ERC20 {\n") +
        "\tconstructor() ERC20(\"".concat(tokenName, "\", \"").concat(tokenSymbol, "\") {\n") +
        "\t\t_mint(".concat(address, ", ").concat(amount, ");\n") +
        "\t}\n" +
        "}";
    //Write source code to file to use flattener
    fs.writeFileSync('./contracts/customERC20.sol', sourceCode, function (err) {
        if (err) {
            console.log(err);
        }
    });
    //Write flattened source code to file
    execSync("./node_modules/.bin/poa-solidity-flattener ./contracts/customERC20.sol"); //, 
    sourceCode = fs.readFileSync("./out/customERC20_flat.sol", "utf8");
    return sourceCode;
}
/**
 * Creates configuration to compiler
 * @param sourceCode
 * @returns {*}
 */
function createERC20Configuration(sourceCode) {
    return {
        language: 'Solidity',
        sources: {
            'customErc20': {
                content: sourceCode
            }
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
function findImports(relativePath) {
    var absolutePath = path.resolve('node_modules', relativePath);
    var source = fs.readFileSync(absolutePath, 'utf8');
    return { contents: source };
}
/**
 * Compiles the sources
 * @param contractName
 * @param configuration
 * @returns {*}
 */
function compileERC20Contract(contractName, configuration) {
    var compiledContracts = JSON.parse(solc.compile(JSON.stringify(configuration), { "import": findImports })).contracts;
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
function deployERC20ContractByPrivateKey(compiledContract, providerName, privateKey, apiKey) {
    return __awaiter(this, void 0, void 0, function () {
        var provider, provider, wallet;
        return __generator(this, function (_a) {
            if (providerName === Providers.Localhost) {
                provider = new ethers.providers.JsonRpcProvider(appconfig_json_1["default"].providerUrl);
            }
            else {
                provider = ethers.getDefaultProvider(providerName, { etherscan: apiKey });
            }
            wallet = new ethers.Wallet(privateKey, provider);
            return [2 /*return*/, deployERC20ContractBySigner(compiledContract, wallet)];
        });
    });
}
/**
 * Deploys the contract by signer and returtns the address
 * @param compiledContract
 * @param signer
 * @returns {} deployed contract
 */
function deployERC20ContractBySigner(compiledContract, signer) {
    return __awaiter(this, void 0, void 0, function () {
        var abi, bytecode, factory, contract;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    abi = compiledContract.abi;
                    bytecode = compiledContract.evm.bytecode.object;
                    factory = new ethers.ContractFactory(abi, bytecode, signer);
                    return [4 /*yield*/, factory.deploy()];
                case 1:
                    contract = _a.sent();
                    return [4 /*yield*/, contract.deployed()];
                case 2:
                    _a.sent();
                    return [2 /*return*/, contract];
            }
        });
    });
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
function verifyERC20Contract(url, apiKey, sourceCode, contractAddress, contractName, compilerVersion) {
    return __awaiter(this, void 0, void 0, function () {
        var data, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    data = new URLSearchParams({
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
                    return [4 /*yield*/, axios.post(url, data)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result.data.result];
            }
        });
    });
}
/**
 * Checks contract verification status
 * @param url ulr to API request
 * @param apiKey etherscan API Key
 * @param guid 50 character guid string
 * @returns {string} response message
 */
function checkERC20ContractVerificationStatus(url, apiKey, guid) {
    return __awaiter(this, void 0, void 0, function () {
        var data, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    data = new URLSearchParams({
                        "apikey": apiKey,
                        "guid": guid,
                        "module": "contract",
                        "action": "checkverifystatus"
                    });
                    return [4 /*yield*/, axios.post(url, data)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result.data.result];
            }
        });
    });
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
function deployAndVerifyContract(contractName, tokenName, tokenSymbol, address, amount, providerName, url, apiKey, privateKey) {
    return __awaiter(this, void 0, void 0, function () {
        var sourceCode, configuration, compiledContract, compilerVersion, contract, verificationResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    address = ethers.utils.getAddress(address); // Injects the checksum (via upper-casing specific letters)
                    sourceCode = createERC20SourceCode(contractName, tokenName, tokenSymbol, address, amount);
                    configuration = createERC20Configuration(sourceCode);
                    compiledContract = compileERC20Contract(contractName, configuration);
                    compilerVersion = "v" + JSON.parse(compiledContract.metadata).compiler.version;
                    return [4 /*yield*/, deployERC20ContractByPrivateKey(compiledContract, providerName, privateKey, apiKey)];
                case 1:
                    contract = _a.sent();
                    console.log("Successfully deployed, contract address: " + contract.address);
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 10000); })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, verifyERC20Contract(url, apiKey, sourceCode, contract.address, contractName, compilerVersion)];
                case 3:
                    verificationResult = _a.sent();
                    _a.label = 4;
                case 4:
                    if (!(verificationResult.length != 50)) return [3 /*break*/, 7];
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 10000); })];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, verifyERC20Contract(url, apiKey, sourceCode, contract.address, contractName, compilerVersion)];
                case 6:
                    verificationResult = _a.sent();
                    return [3 /*break*/, 4];
                case 7:
                    console.log("Verification guid: " + verificationResult);
                    return [2 /*return*/];
            }
        });
    });
}
module.exports =
    { createERC20SourceCode: createERC20SourceCode, createERC20Configuration: createERC20Configuration, compileERC20Contract: compileERC20Contract, deployERC20ContractByPrivateKey: deployERC20ContractByPrivateKey, deployERC20ContractBySigner: deployERC20ContractBySigner, verifyERC20Contract: verifyERC20Contract, checkERC20ContractVerificationStatus: checkERC20ContractVerificationStatus, deployAndVerifyContract: deployAndVerifyContract, Providers: Providers
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
