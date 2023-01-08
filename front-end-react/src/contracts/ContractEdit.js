import * as React from "react";
import { useState } from 'react';
import {
    Edit,
    SimpleForm,
    SelectInput,
    TextInput,
    useNotify,
    TextField,
    useRecordContext
} from 'react-admin';
import { Grid } from '@mui/material';

var contractUtils = require('./contractUtils');

const ContractEdit = () => {
    return <Edit>
        <EditForm/>
    </Edit>
}

const EditForm = () => {
    const record = useRecordContext();
    const notify = useNotify();
    const [contractType, setContractType] = useState(record.contractParams.contractType);
    const [contractName, setContractName] = useState(record.contractParams.contractName);
    const [tokenName, setTokenName] = useState(record.contractParams.tokenName);
    const [tokenSymbol, setTokenSymbol] = useState(record.contractParams.tokenSymbol);
    const [addressToMint, setAddressToMint] = useState(record.contractParams.addressToMint);
    const [amount, setAmount] = useState(record.contractParams.amount);

    return <SimpleForm>
        <Grid container gap="10px">
            <SelectInput 
                source="contractParams.contractType" 
                label="Contract type"
                defaultValue={"ERC20"}
                validate={contractUtils.validateContractType}
                onChange={(value) => setContractType(value.target.value)}
                choices={[
                    {id: "ERC20", name: "ERC20"},
            ]}/>
            <TextInput 
                source="contractParams.contractName"
                label="Contract name"
                onChange={(value) => setContractName(value.target.value)}
                validate={contractUtils.validateERC20ContractName}/>
            <TextInput 
                source="contractParams.tokenName"
                label="Token name"
                onChange={(value) => setTokenName(value.target.value)}
                validate={contractUtils.validateERC20TokenName}/>
            <TextInput 
                source="contractParams.tokenSymbol" 
                onChange={(value) => setTokenSymbol(value.target.value)}
                validate={contractUtils.validateERC20TokenSymbol}/>
        </Grid>
        <Grid container gap="10px">
            <TextInput 
                sx={{width: { xl: 450}}} 
                source="contractParams.addressToMint"
                label="Address"
                defaultValue={addressToMint} 
                onChange={(value) => setAddressToMint(value.target.value)}
                validate={contractUtils.validateEtherAddress}/>
            <TextInput 
                source="contractParams.amount" 
                label="Amount"
                defaultValue={amount} 
                onChange={(value) => setAmount(value.target.value)}
                validate={contractUtils.validateERC20Amount}/>
        </Grid>
        <TextField 
            sx={{fontWeight: "bold", fontSize: "1.5em"}}
            emptyText="Contract Source Code"/>
        <TextField 
            component="pre" 
            sx={{ backgroundColor: "ghostwhite", borderRadius: 1, padding: "10px" }} 
            emptyText={contractUtils.getContractSourceCode(contractType, {contractName, tokenName, tokenSymbol, addressToMint, amount})}/>
    </SimpleForm>
}

export default ContractEdit;