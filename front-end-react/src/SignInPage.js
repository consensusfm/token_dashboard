import * as React from 'react';
import { useState } from 'react';
import { useLogin, useNotify, TextInput } from 'react-admin';
import { Button, CardContent } from '@mui/material';
import Box from '@mui/material/Box'
import { Form, required} from 'ra-core';

const SignInPage = (props) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const login = useLogin();
    const notify = useNotify();

    const handleSubmit = e => {
        login({ username, password} ).catch(() =>
            notify('Invalid username or password')
        );
    };

    return (
        <Box sx={{
            width: '100%', 
            minHeight: '100vh', 
            backgroundImage: 'radial-gradient(circle at 50% 14em, #313264 0%, #00023b 60%, #00023b 100%)',
            justifyContent: "center",
            alignItems: "center",
            display: "flex",
            flexDirection: "column"
            }}>
            <Box sx={{width: 300, backgroundColor: 'white', borderRadius: 2}}>
                <Form onSubmit={handleSubmit}>
                    <CardContent sx={{display: "flex", flexDirection: "column", alignItems: "center"}}>
                        <h1>Sign in</h1>
                        <TextInput
                            name="username"
                            source="username"
                            validate={required()}
                            fullWidth
                            onChange={e => setUsername(e.target.value)}/>
                        <TextInput
                            name="password"
                            type="password"
                            source="password"
                            validate={required()}
                            fullWidth
                            onChange={e => setPassword(e.target.value)}/>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            sx={{marginBottom: 2}}>
                                Sign in
                        </Button>
                        <Button
                            type="button"
                            variant="text"
                            color="secondary"
                            fullWidth
                            onClick={() => props.onFormSwitch('signup')}> 
                                Sign up
                        </Button>
                    </CardContent>
                </Form>
            </Box>
        </Box>
    );
};

export default SignInPage