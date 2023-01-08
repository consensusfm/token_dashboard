import * as React from "react";
import { useState } from 'react';
import {
    Create,
    SimpleForm,
    SelectInput,
    TextInput,
    TextField,
    useNotify,
} from 'react-admin';
import { Grid } from '@mui/material';
var contractUtils = require('./contractUtils');

const ContractCreate = props => {
    const notify = useNotify();
   
    const [contractType, setContractType] = useState("ERC20");
    const [contractName, setContractName] = useState("Contract123");
    const [tokenName, setTokenName] = useState("Token123");
    const [tokenSymbol, setTokenSymbol] = useState("TKN123");
    const [addressToMint, setAddress] = useState("0x4E2d268620BFF4ECf878c4CaD44518225B3ff098");
    const [amount, setAmount] = useState("1000000000");

    return <Create {...props}>
        <SimpleForm>
            <Grid container gap="10px">
                <SelectInput 
                    source="contractType" 
                    defaultValue={"ERC20"}
                    validate={contractUtils.validateContractType}
                    onChange={(value) => setContractType(value.target.value)}
                    choices={[
                        {id: "ERC20", name: "ERC20"},
                        // {id: "ERC721", name: "ERC721"}
                ]}/>
                <TextInput
                    source="contractName" 
                    defaultValue={"Contract123"} 
                    onChange={(value) => setContractName(value.target.value)}
                    validate={contractUtils.validateERC20ContractName}/>
                <TextInput 
                    source="tokenName" 
                    defaultValue={"Token123"}
                    onChange={(value) => setTokenName(value.target.value)} 
                    validate={contractUtils.validateERC20TokenName}/>
                <TextInput 
                    source="tokenSymbol" 
                    defaultValue={"TKN123"} 
                    onChange={(value) => setTokenSymbol(value.target.value)} 
                    validate={contractUtils.validateERC20TokenSymbol}/>
            </Grid>
            <Grid container gap="10px">
                <TextInput sx={{width: { xl: 450}}}
                    source="address" 
                    defaultValue={"0x4E2d268620BFF4ECf878c4CaD44518225B3ff098"}
                    onChange={(value) => { setAddress(value.target.value)}}
                    validate={contractUtils.validateEtherAddress}/>
                <TextInput 
                    source="amount" 
                    defaultValue={1000000000}
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
    </Create>
}

export default ContractCreate;