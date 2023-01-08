import * as React from "react";
import { useState } from 'react';
import { Card, CardContent } from '@mui/material';
import { Title, SimpleForm, TextInput, useNotify, TextField } from 'react-admin';
import dataProvider from "./dataProvider";

const Profile = (props) => {
    const notify = useNotify();
    
    const [ethApiKey, setEthApiKey] = useState(localStorage.getItem("ethApiKey"));

    const handleSubmit = async () => {
        // Write to db new api key for user
        const writeResult = await dataProvider.writeUserSettings("users", {id: localStorage.getItem("userId"), ethApiKey: ethApiKey});
        console.log(writeResult.data);
        notify(writeResult.data.message);
        localStorage.setItem('ethApiKey', ethApiKey);
    };

    return (
        <Card>
            <CardContent>
                <SimpleForm onSubmit={handleSubmit}>
                    <TextField sx={{fontSize: "2em", textDecoration: "underline"}} emptyText={localStorage.getItem("username")}/>
                    <TextInput sx={{width: { xl: "400px"}}} source="Etherscan Api Key" defaultValue={ethApiKey} onChange={e => setEthApiKey(e.target.value)}/>
                </SimpleForm>
            </CardContent>
        </Card>
    );
}

export default Profile;