import * as React from 'react';
import { useState } from 'react';
import { useNotify, TextInput } from 'react-admin';
import { Button, CardContent } from '@mui/material';
import Box from '@mui/material/Box'
import { Form, required } from 'ra-core';
import authProvider from './authProvider';

const SignUpPage = (props) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confPassword, setConfPassword] = useState('');
    const notify = useNotify();

    const handleSubmit = async () => {
        if (password === confPassword) {
            try {
                const response = await authProvider.register({username, password});
                notify("New user registered");
            } catch (error) {
                notify("Registration error");
            }
        } else {
            notify("Password confirmation does not match");
        }
    };

    return (
        <Box sx={{
            width: '100%', 
            minHeight: '100vh', 
            backgroundImage: 'radial-gradient(circle at 50% 14em, #313264 0%, #00023b 60%, #00023b 100%)',
            border: '0px dashed black',
            justifyContent: "center",
            alignItems: "center",
            display: "flex",
            flexDirection: "column"
            }}>
            <Box sx={{width: 300,  backgroundColor: 'white', borderRadius: 2}}>
                <Form onSubmit={handleSubmit}>
                    <CardContent sx={{display: "flex", flexDirection: "column", alignItems: "center"}}>
                        <h1>Sign up</h1>
                        <TextInput
                            name="username"
                            source="username"
                            validate={required()}
                            fullWidth
                            onChange={e => setUsername(e.target.value)}
                        />
                        <TextInput
                            name="password"
                            type="password"
                            source="password"
                            validate={required()}
                            fullWidth
                            onChange={e => setPassword(e.target.value)}
                        />
                        <TextInput
                            name="confPassword"
                            type="password"
                            source="confPassword"
                            label="Confirm Password"
                            validate={required()}
                            fullWidth
                            onChange={e => setConfPassword(e.target.value)}
                        />
                        <Button type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            sx={{marginBottom: 2}}>
                                Sign up
                        </Button>
                        <Button 
                            type="button"
                            variant="text"
                            color="secondary"
                            fullWidth
                            onClick={() => props.onFormSwitch('signin')}>
                                Sign in
                        </Button>
                    </CardContent>
                </Form>
            </Box>
        </Box>
    );
};

export default SignUpPage