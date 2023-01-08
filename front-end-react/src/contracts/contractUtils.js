import {
    required,
    minLength,
    maxLength,
    minValue,
    maxValue,
    number,
    regex,
    email,
    choices
} from 'react-admin';
import { ethers } from 'ethers';

const getContractSourceCode = (contractType, contractParams) => {
    switch (contractType) {
        case "ERC20":
            return String.raw
            `   contract ${contractParams.contractName} is ERC20 {
                constructor() ERC20("${contractParams.tokenName}", "${contractParams.tokenSymbol}") {
                    _mint(${contractParams.address}, ${contractParams.amount});
                }
            }`;
        case "ERC721":
            return String.raw
            `${contractParams.contractName} : ${contractParams.tokenName}`;
        default:
            return("");
    }
}

// Contracts params validation
const addressValidation = (value, allValues) => {
    if (!ethers.utils.isAddress(value)) {
        return "Address to mint isn't correct";
    }
    return undefined;
}

const checkSpaces = (value, allValues) => {
    if (/\s/g.exec(value)) {
        return "Incorrect value"
    }
    return undefined;
}

const validateContractType = [required()];
const validateERC20ContractName = [required(), checkSpaces, minLength(2), maxLength(30)];
const validateERC20TokenName = [required(), checkSpaces];
const validateERC20TokenSymbol = [required(), checkSpaces];
const validateEtherAddress = [required(), addressValidation];
const validateERC20Amount = [required(), number(), minValue(1)];

export { 
    getContractSourceCode,
    validateContractType,
    validateERC20ContractName,
    validateERC20TokenName,
    validateERC20TokenSymbol,
    validateEtherAddress,
    validateERC20Amount
}