import * as React from "react";
import { useState, useEffect, useRef, createElement } from "react";
import {
    List,
    TextField,
    ShowButton,
    Datagrid,
    DatagridBody,
    RecordContextProvider,
    useRefresh,
    useNotify,
    EditButton,
    TopToolbar,
    FilterButton,
    CreateButton,
    ExportButton,
    Button,
    TextInput,
} from 'react-admin';
import { ethers } from 'ethers';
import { Card, Typography, Divider, Stack } from '@mui/material';
import { IconButton, TableCell, TableRow, Checkbox, Box } from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import AssistWalkerIcon from '@mui/icons-material/AssistWalker';
import RocketIcon from '@mui/icons-material/Rocket';
import AirportShuttleIcon from '@mui/icons-material/AirportShuttle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import dataProvider from "../dataProvider";

const MyDatagridRow = ({ record }) => {
    const refresh = useRefresh();
    const notify = useNotify();
    
    async function Deploy() {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({method: "eth_requestAccounts",});
                var provider = new ethers.providers.Web3Provider(window.ethereum);
                const account = accounts[0];
                var signer = provider.getSigner();
                const abi = record.output.abi;
                const bytecode = record.output.evm.bytecode;
                const factory = new ethers.ContractFactory(abi, bytecode, signer);
                const contract = await factory.deploy();
                await contract.deployed();
                if (contract.address) {
                    notify(`Contract deployed. Address: ${contract.address}`);
                    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                    dataProvider.writeContractAddress("writeContractAddress", {id: record.id, address: contract.address, chainId: chainId});
                    refresh();
                } else {
                    notify("Deployment error");
                    console.log("Deployment error");
                }
            } catch(error) {
                notify("Deployment error");
                console.log("Deployment error");
            }
        } else {
            notify("Meta Mask not detected");
            console.log("Meta Mask not detected");
        }
        refresh();
    }
    
    async function Verify() {
        if (window.ethereum) {
            try {
                const verifResult = 
                    await dataProvider.verifyContract("verifyContract", {id: record.id, userId: localStorage.getItem("userId")});
                notify(verifResult.data.message);
            } catch (error) {
                notify(`Verification error: ${error.message}`);
                console.log(error.message);
            }
            refresh();
        } else {
            notify("Meta Mask not detected");
            console.log("Meta Mask not detected");
        }
    }

    function ShowOnEtherscan() {
        var url;
        switch (record.chainId) {
            case "0x1":
                url = "https://etherscan.io/address/" + record.address;
                break;
            case "0x5":
                url = "https://goerli.etherscan.io/address/" + record.address;
                break;
            case "0x11155111":
                url = "https://sepolia.etherscan.io/address/" + record.address;
                break;
        }
        window.open(url, '_blank').focus();
    }

    var isVerifiable = (record.verificationGuid === "null" && record.address !== "null") ? true : false;
    var isDeployable = record.address === "null" ? true : false;
    return <RecordContextProvider value={record}>
         <TableRow>
            <TableCell>
                <TextField source="contractParams.tokenName" emptyText="empty"/>
            </TableCell>
            <TableCell>
                <TextField source="contractParams.tokenSymbol" emptyText="empty"/>
            </TableCell>
            <TableCell>
                {record.address !== "null" ?
                    <IconButton onClick={ShowOnEtherscan}>
                        <TextField sx={{ color: "black" }} source="address"/>
                    </IconButton> :
                    <TextField sx={{ color: "black" }} emptyText="-"/>
                }
            </TableCell>
            <TableCell>
                {isDeployable ? 
                    <IconButton onClick={Deploy} icon={RocketLaunchIcon} size="small" disabled={false}> 
                        <RocketLaunchIcon/> 
                    </IconButton> :
                    <IconButton onClick={Deploy} icon={RocketLaunchIcon} size="small" disabled={true}> 
                        <RocketLaunchIcon/> 
                    </IconButton>
                }
            </TableCell>
            <TableCell>
                {isVerifiable ?
                    <IconButton onClick={Verify} icon={RocketLaunchIcon} size="small" disabled={false}>
                        <CheckCircleOutlineIcon/>
                    </IconButton> :
                    <IconButton onClick={Verify} icon={RocketLaunchIcon} size="small" disabled={true}>
                        <CheckCircleOutlineIcon/>
                    </IconButton>
                } 
            </TableCell>
            <TableCell>
                <ShowButton />
            </TableCell>
            <TableCell>
                {record.address === "null" ?
                    <EditButton disabled={false}/> :    
                    <EditButton disabled={true}/>
                }
            </TableCell>
         </TableRow>
    </RecordContextProvider>
}

const MyDatagridHeader = () => (
    <TableRow sx={{ backgroundColor: "Lavender" }}>
        <TableCell>
            <TextField sx={{ fontWeight: "bold" }} emptyText="Token Name"/>
        </TableCell>
        <TableCell>
            <TextField sx={{ fontWeight: "bold" }} emptyText="Token Symbol"/>
        </TableCell>
        <TableCell>
            <TextField sx={{ fontWeight: "bold" }} emptyText="Contract address"/>
        </TableCell>
        <TableCell>
            <TextField sx={{ fontWeight: "bold" }} emptyText="Deploy"/>
        </TableCell>
        <TableCell>
            <TextField sx={{ fontWeight: "bold" }} emptyText="Verify"/>
        </TableCell>
        <TableCell> 
        </TableCell>
        <TableCell> 
        </TableCell>
    </TableRow>
);

const TopInfo = () => {
    const [ethInfo, setEthInfo] = useState({
        FastGasPrice: 0,
        ProposeGasPrice: 0, 
        SafeGasPrice: 0,
        suggestBaseFee: 0, 
        LastBlock: 0
    });
    
    useEffect( () => {
        async function fetchData() {
            try {
                const res = await dataProvider.getEthInfoFromEtherscan();
                setEthInfo(JSON.parse(res.body).result);
            } catch (err) {
                console.log(err);
            }
        }
        fetchData();
    }, []);

    useEffect( () => {
        const interval = setInterval(async () => {
            try {
                const res = await dataProvider.getEthInfoFromEtherscan();
                setEthInfo(JSON.parse(res.body).result);
            } catch (err) {
                console.log(err);
            }
        }, 10000);    
        return () => clearInterval(interval);
    }, []);

    return <Box
        sx={{ display: "flex",flexDirection: "row"}}> 
            <CardWithIcon
                icon={AssistWalkerIcon}
                text={`Safe low: ${ethInfo.SafeGasPrice} Gwei`}
            />
            <CardWithIcon
                icon={AirportShuttleIcon}
                text={`Propose: ${ethInfo.ProposeGasPrice} Gwei`}
            />
            <CardWithIcon
                icon={RocketIcon}
                text={`Fast: ${ethInfo.FastGasPrice} Gwei`}
            />
            <CardWithIcon
                icon={LocalAtmIcon}
                text={`Base fee: ${Number(ethInfo.suggestBaseFee).toFixed(2)}`}
            />
            <CardWithIcon
                icon={CheckBoxOutlineBlankIcon}
                text={`Last block: ${ethInfo.LastBlock}`}
            />
    </Box>
}

const CardWithIcon = (props) => {
    const { icon, text  } = props;
    return (
        <Card
            sx={{
                width: "20%",
                margin: "1em",
                //minHeight: 52,
                display: 'flex',
                flexDirection: 'column',
            }}>
                <Box
                    sx={{
                        overflow: 'inherit',
                        padding: '5px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        '& .icon': {
                            color: theme =>
                                theme.palette.mode === 'dark'
                                    ? 'inherit'
                                    : '#1884f0' //'#dc2440',
                        },
                    }}
                >
                    <Box width="3em" className="icon">
                        {createElement(icon, { fontSize: 'large' })}
                    </Box>
                    <Box textAlign="right">
                        <Typography variant="h6" component="h3">
                            {text}
                        </Typography>
                    </Box>
                </Box>
        </Card>
    );
};

const MyDatagridBody = props => <DatagridBody {...props} row={<MyDatagridRow />}/>;
const MyDatagrid = props => <Datagrid {...props} body={<MyDatagridBody />} header={MyDatagridHeader}/>;

const contractFilters = [
    <TextInput 
        source="contractParams.tokenName" 
        label="Token name" 
        alwaysOn />
];

const ListActions = () => (
    <TopToolbar sx={{marginTop: "0px"}}>
        {/* <FilterButton filters={contractFilters}/> */}
        <CreateButton/>
        {/* <ExportButton/> */}
    </TopToolbar>
);

const ContractList = () => (
    <>
        <TopInfo/>        
        <List
            sx={{padding: "0px"}}
            filters={contractFilters}
            actions={<ListActions/>}>
                <MyDatagrid bulkActionButtons={false} >
                </MyDatagrid>
        </List>
    </>
)

export default ContractList;