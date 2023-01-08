import * as React from "react";
import {
    BooleanField,
    TopToolbar,
    Show,
    SimpleForm,
    TextInput,
    useRecordContext,
    DateTimeInput,
    EditButton,
} from 'react-admin';
import { JsonField } from "react-admin-json-view";
import { Grid } from '@mui/material';

const PostShowActions = () => {
    const record = useRecordContext();
    return <TopToolbar>
        {record.address === "null" ?
            <EditButton></EditButton> :
            <EditButton disabled={true}></EditButton>
        }
    </TopToolbar>
}

const ContractShow = () => (
    <Show actions={<PostShowActions/>}>
        <ContrtactForm />
    </Show>
);

const ContrtactForm = () => {
    const record = useRecordContext();
    var network;
    switch (record.chainId) {
        case "0x1":
            network = "Mainnet";
            break;
        case "0x5":
            network = "Goerli";
            break;
        case "0x11155111":
            network = "Sepolia";
            break;
        default:
            network = "-";
    }
    
    return <SimpleForm toolbar={false}>
        <Grid container gap="10px">
            <div>Deployed</div>
                <BooleanField 
                    source="deployed" 
                    valueLabelTrue="Deployed" 
                    valueLabelFalse="Not deployed"/>
            <div>Verified</div>
                <BooleanField 
                    source="verified" 
                    valueLabelTrue="Verified" 
                    valueLabelFalse="Not verified"/>   
        </Grid>
        <Grid container gap="10px">
            {record.deployed ?
                <TextInput 
                    sx={{width: { xl: '30%'}}} 
                    InputProps={{ readOnly: true }} 
                    source="address"/> :
                <TextInput 
                    sx={{width: { xl: '30%'}}} 
                    InputProps={{ readOnly: true }} 
                    source="Address" 
                    defaultValue="-"/>
            }
            <TextInput 
                sx={{width: { xl: '20%'}}} 
                InputProps={{ readOnly: true }} 
                source="contractParams.contractType"
                label="Contract type"
                defaultValue="-"/>
            <TextInput 
                sx={{width: { xl: '20%'}}} 
                InputProps={{ readOnly: true }} 
                source ="network" 
                defaultValue={network}/>
            <DateTimeInput 
                sx={{width: { xl: '20%'}}} 
                InputProps={{ readOnly: true }} 
                source="timestamp"/>
        </Grid>
        <TextInput 
            sx={{width: { xl: '100%'}, color: "blue"}}
            InputProps={{ readOnly: true }}
            multiline={true} 
            source="code" 
            editable={false}
            selectTextOnFocus={false}
        />

        <div>Output</div>
        <JsonField
            source="output"
            jsonString={false} // Set to true if the value is a string, default: false
            reactJsonOptions={{
            name: null,
            collapsed: true,
            enableClipboard: false,
            displayDataTypes: false,
            }}
        />
    </SimpleForm>
}

export default ContractShow;