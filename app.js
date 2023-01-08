var express = require('express');
var mongoose = require('mongoose');
var deployLib = require('./deployLib');
var crypto = require('crypto');
var bcrypt = require('bcrypt');
var cors = require('cors');
const querystring = require('querystring');
var config = require('./appconfig.json');
const bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

mongoose.connect("mongodb://mongodb:27017/contracts", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, (err) => {
    if (err) {
        console.log("db connection error");
    } else {
        console.log("connected to db");
    }
});

const contract = new mongoose.Schema({
    userId: String,
    timestamp: Number,
    address: String,
    chainId: String,
    verificationGuid: String,
    contractParams: {},
    input: {},
    output: {}
});

const user = new mongoose.Schema({
    login: String,
    hashedPassword: String,
    ethApiKey: String
});

const contractModel = mongoose.model("contract", contract);
const userModel = mongoose.model("user", user);

//Authorization
const tokenKey = config.jwtKey;

function checkAuthorization(token) {
    if (token) {
        if (token.split(' ')[0] != "Bearer")
            return false;
        let tokenParts = token
            .split(' ')[1]
            .split('.')
        let signature = crypto
            .createHmac('SHA256', tokenKey)
            .update(`${tokenParts[0]}.${tokenParts[1]}`)
            .digest('base64')

        return signature === tokenParts[2];
    }
    return false;
}

//Check user in db
async function checkUser(login, password) {
    if (login && password) {
        try {
            var user = await userModel.findOne({login: login});
            var pwHash = bcrypt.hashSync(password, config.salt);
            return pwHash === user.hashedPassword;
        } catch (err) {
            console.log(err.message);
            return false;
        }
    } else {
        return false;
    }
}

// Write user data in db
app.post("/users/:id", async (req, res) => {
     if (checkAuthorization(req.headers.authorization)) {
        const {id} = req.params;
        try {
            await userModel.updateOne({_id: id}, {ethApiKey: req.body.ethApiKey});
            return res
                .status(200)
                .send({message: "User data updated"});
        } catch (err) {
            return res
                .status(500)
                .send({message: "Internal Server Error: " + err});
        }
    } else {
        return res
            .status(401)
            .json({message: "Authorization error"});
    }
})

// Send jwt and user data
app.post("/api/auth", async (req, res) => {
    if (await checkUser(req.body.login, req.body.password)) {
        try {
            let head = Buffer.from(JSON.stringify({alg: 'HS256', typ: 'jwt'})).toString('base64')
            let body = Buffer.from(req.body.login + req.body.password).toString('base64')
            let signature = crypto
                .createHmac('SHA256', config.jwtKey)
                .update(`${head}.${body}`)
                .digest('base64')
            var user = await userModel.findOne({login: req.body.login});
            return res.status(200).json({
                token: `${head}.${body}.${signature}`,
                id: user._id,
                ethApiKey: user.ethApiKey
            })
        } catch(err) {
            return res
                .status(500)
                .send({message: "Internal Server Error: " + err});
        }
    }
    return res
        .status(401)
        .json({message: "Authorization error"});
})

//Create new user in db
app.post("/createUser", async (req, res) => {
    if (!(req.body.login && req.body.password)) {
        return res
            .status(422)
            .send({message: "Incorrect login or password"});
    }
    var user = await userModel.findOne({login: req.body.login});
    if (user) {
        return res
            .status(409)
            .send({message: "User already exists"});
    }
    try {
        var pwHash = bcrypt.hashSync(req.body.password, config.salt);
        const data = new userModel({
            login: req.body.login,
            hashedPassword: pwHash,
            ethApiKey: ""
        });
        const val = await data.save();
        return res
            .status(200)
            .json({message: "New user added", userId: val._id});
    } catch (err) {
        return res
            .status(500)
            .send({message: "Internal Server Error: " + err});
    }
})

// Get all contracts
app.get("/contracts", async (req, res) => {
    if (checkAuthorization(req.headers.authorization)) {
        const sort = JSON.parse(req.query.sort);
        const range = JSON.parse(req.query.range);
        const filter = JSON.parse(req.query.filter);
        const order = sort[1] === "ASC" ? 1 : -1;
        const tn = filter?.contractParams?.tokenName ? filter.contractParams.tokenName : "";
        const re = new RegExp(`${tn}`, `g`);
        const totalAmount = await contractModel.find({"userId": req.headers.userid}).count(); // total amount for correct pagination
        const allContracts = await contractModel
            .find({"userId": req.headers.userid, "contractParams.tokenName": {$regex: re}})
            .skip(range[0])
            .limit(range[1] - range[0] + 1)
            .sort({ "contractParams.tokenName": order });
        return res
            .append("Access-Control-Expose-Headers", "X-Total-Count")
            .append("X-Total-Count", totalAmount)
            .status(200)
            .send(allContracts)
    } else {
        return res
            .status(401)
            .json({message: "Authorization error"});
    }
})

// Get contract by id
app.get("/contracts/:id", (req, res) => {
    if (!checkAuthorization(req.headers.authorization)) {
        return res
            .status(401)
            .json({message: "Authorization error"});
    }
    const {id} = req.params;
    contractModel.findOne({_id: id}, (err, contract) => {
        if (err) {
            return res
                .status(404)
                .send({message: "Contract not found"});
        }
        return res
            .status(200)
            .send(contract);
    })
})

// Create new contract in db
app.post("/contracts", async (req, res) => {
    if (checkAuthorization(req.headers.authorization)) {
        var sourceCode = deployLib.createERC20SourceCode(req.body.contractName, req.body.tokenName, req.body.tokenSymbol, req.body.address, req.body.amount);
        var configuration = deployLib.createERC20Configuration(sourceCode);
        var compiledContract = deployLib.compileERC20Contract(req.body.contractName, configuration);
        const data = new contractModel({
            userId: req.headers.userid,
            timestamp: Date.now(),
            address: "null",
            chainId: "",
            verificationGuid: "null",
            contractParams: {
                contractType: req.body.contractType,
                contractName: req.body.contractName,
                tokenName: req.body.tokenName,
                tokenSymbol: req.body.tokenSymbol,
                addressToMint: req.body.address,
                amount: req.body.amount},
            input: configuration,
            output: compiledContract
        })
        const val = await data.save();
        res
            .status(200)
            .json({message: "New contract added", contractId: val._id});
    } else {
        return res
            .status(401)
            .json({message: "Authorization error"});
    }
})

// Edit contract in db
app.put("/contracts/:id", async (req, res) => {
    const {id} = req.params;
    if (checkAuthorization(req.headers.authorization)) {
        try {
        var sourceCode = deployLib.createERC20SourceCode(req.body.contractName, req.body.tokenName, req.body.tokenSymbol, req.body.addressToMint, req.body.amount);
        var configuration = deployLib.createERC20Configuration(sourceCode);
        var compiledContract = deployLib.compileERC20Contract(req.body.contractName, configuration);
        await contractModel.updateOne({_id: id}, {
            'timestamp' : Date.now(),
            'contractParams.contractType': req.body.contractType,
            'contractParams.contractName': req.body.contractName,
            'contractParams.tokenName': req.body.tokenName,
            'contractParams.tokenSymbol' : req.body.tokenSymbol,
            'contractParams.addressToMint' : req.body.addressToMint,
            'contractParams.amount' : req.body.amount,
            'input' : configuration,
            'output': compiledContract});
        return res
            .status(200)
            .send({message: "Contract updated"});
        } catch (err) {
            return res
                .status(500)
                .send({message: "Internal Server Error: " + err});
        }
        // });
    } else {
        return res
            .status(401)
            .json({message: "Authorization error"});
    }  
})

// Deploy contract
app.post("/deployContract/:id", async (req, res) => {
    if (checkAuthorization(req.headers.authorization)) {
        const {id} = req.params;
        try {
            var contractFromDb = await contractModel.findOne({_id: id});
            if (!contractFromDb) {
                return res
                    .status(404)
                    .send({message: "Contract not found"});
            } else {
                if (contractFromDb.address === "null") {
                    //Deploy logic
                    var compiledContract = contractFromDb.output;
                    var deployedContract = await deployLib.deployERC20ContractByPrivateKey(compiledContract, req.body.providerName, req.body.privateKey, req.body.apiKey);
                    await contractModel.updateOne({_id: id}, {address: deployedContract.address});
                    return res
                        .status(200)
                        .json({message: "Successfully deployed", contractAddress: deployedContract.address});
                } else {
                    return res
                        .status(200)
                        .json({message: "Contract already deployed", contractAddress: contractFromDb.address});
                }
            }
        } catch (err) {
            return res
                .status(500)
                .send({message: "Internal Server Error: " + err});
        }
    } else {
        return res
            .status(401)
            .json({message: "Authorization error"});
    }
})

// Write contract address and chain id (use when contract deployed in the forntend)
app.post("/writeContractAddress/:id", async (req, res) => {
    const {id} = req.params;
    if (checkAuthorization(req.headers.authorization)) {
        if ((req.body.address) && (req.body.address.length == 42)) {
            try {
                await contractModel.updateOne({_id: id}, {address: req.body.address, chainId: req.body.chainId});
                return res
                    .status(200)
                    .json({message: "Address added"});
            } catch (err) {
                return res
                    .status(500)
                    .send({message: "Internal Server Error: " + err});
            }
        } else {
            return res
                .status(422)
                .send({message: "Incorrect contract address"});
        }
    } else {
        return res
            .status(401)
            .json({message: "Authorization error"});
    }
})

// Verify contract
app.post("/verifyContract/:id", async (req, res) => {
    if (checkAuthorization(req.headers.authorization)) {
        const {id} = req.params;
        try {
            var contractFromDb = await contractModel.findOne({_id: id});
            if (!contractFromDb) {
                return res
                    .status(404)
                    .send({message: "Contract not found"});
            } else {
                if (contractFromDb.verificationGuid === "null") {
                    //Verification logic
                    var sourceCode = contractFromDb.input.sources.customErc20.content;
                    var user = await userModel.findOne({_id: req.body.userId});
                    const etherscanApiKey = user.ethApiKey;
                    var compiledContract = contractFromDb.output;
                    var compilerVersion = "v" + JSON.parse(compiledContract.metadata).compiler.version;
                    var url;
                    switch (contractFromDb.chainId) {
                        case "0x1":
                            url = "https://api.etherscan.io/api";
                            break;
                        case "0x5":
                            url = "https://api-goerli.etherscan.io/api";
                            break;
                        case "0x11155111":
                            url = "https://api-sepolia.etherscan.io//api";
                            break;
                    }
                    var verificationResult = await deployLib.verifyERC20Contract(
                        url,
                        etherscanApiKey,
                        sourceCode,
                        contractFromDb.address,
                        contractFromDb.contractName,
                        compilerVersion
                    );
                    while (verificationResult.length != 50) {
                        if (verificationResult === "Missing or invalid ApiKey") {
                            return res
                                .status(422)
                                .json({message: "Missing or invalid ApiKey"});
                        }
                        await new Promise(resolve => setTimeout(resolve, 10000));
                        verificationResult = await deployLib.verifyERC20Contract(
                            req.body.url,
                            req.body.etherscanApiKey,
                            sourceCode,
                            contractFromDb.address,
                            req.body.contractName,
                            compilerVersion
                        );
                    }
                    await contractModel.updateOne({_id: id}, {verificationGuid: verificationResult});
                    return res
                        .status(200)
                        .json({message: "Successfully verified", verificationGuid: verificationResult});
                } else {
                    return res
                        .status(200)
                        .json({
                            message: "Contract  already  verified",
                            verificationGuid: contractFromDb.verificationGuid
                        });
                }
            }
        } catch (err) {
            return res
                .status(500)
                .send({message: "Internal Server Error: " + err});
        }
    } else {
        return res
            .status(401)
            .json({message: "Authorization error"});
    }
})

// Delete contract
app.delete("/contracts/:id", (req, res) => {
    if (checkAuthorization(req.headers.authorization)) {
        const {id} = req.params;
        contractModel.remove({_id: id}, (err) => {
            if (err) {
                return res
                    .status(404)
                    .send({message: "Contract not found"});
            }
            return res
                .status(200)
                .json({message: "Contract deleted or not existed"});
        });
    } else {
        return res
            .status(401)
            .json({message: "Authorization error"});
    }
})

const host = '127.0.0.1';
const port = 8080;
app.listen(port, () => {
    console.log(`Server listens http://${host}:${port}`)
});
