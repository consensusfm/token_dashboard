import React from "react";
import { forwardRef, useState } from 'react';
import { UserMenu, MenuItemLink, useLogout, ToggleThemeButton, defaultTheme, useNotify } from "react-admin";
import SettingsIcon from '@mui/icons-material/Settings';
import ExitIcon from '@mui/icons-material/PowerSettingsNew';
import { MenuItem, createTheme } from '@mui/material';
import { IconButton, Tooltip } from '@mui/material';
import LanIcon from '@mui/icons-material/Lan';
import { ethers } from 'ethers';

const darkTheme = createTheme({
  palette: { mode: 'dark' },
});

const MyLogoutButton = forwardRef((props, ref) => {
    const logout = useLogout();
    const handleClick = () => logout();
    return (
        <MenuItem
          onClick={handleClick}
          ref={ref}>
          <ExitIcon sx={{paddingRight: "15px"}}/> Logout
        </MenuItem>
    );
});

const MyUserMenu = (props) => {
  var chainId, network;
  const notify = useNotify();
  async function connectToMetamask() {
    // Check if Meta Mask Extensioin exists
    if (window.ethereum) {
    try {
          chainId = await window.ethereum.request({ method: 'eth_chainId' });
          switch (chainId) {
              case "0x1":
                network = "Mainnet";
                break;
              case "0x5":
                network = "Goerli";
                break;
              case "0x11155111":
                network = "Sepolia";
                break;
          }
          notify(`Connected to ${network}`);
      } catch(error) {
        notify("Connection error");
      }
    } else {
      notify("Meta Mask not detected");
    }
  }   

  return (
    <>
      <Tooltip title="Connect to metamask">
        <IconButton color="inherit" onClick={connectToMetamask}>
            <LanIcon/>
        </IconButton>
      </Tooltip>
      <ToggleThemeButton
                  lightTheme={defaultTheme}
                  darkTheme={darkTheme}
      />
      <UserMenu {...props}>
        <MenuItemLink
          to="/profile"
          primaryText="My Profile"
          leftIcon={<SettingsIcon />}
        />
        <MyLogoutButton />
      </UserMenu>
    </>
  );
};

export default MyUserMenu;
