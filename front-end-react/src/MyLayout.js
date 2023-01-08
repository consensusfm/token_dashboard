import * as React from 'react';
import { Layout, AppBar } from 'react-admin';
import MyUserMenu from "./MyUserMenu";

const MyAppBar = props => 
    <AppBar {...props} userMenu={<MyUserMenu />} >
    </AppBar>

const MyLayout = (props) => (
    <Layout {...props} appBar={MyAppBar} />
);

export default MyLayout;