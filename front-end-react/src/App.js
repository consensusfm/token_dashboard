import * as React from "react";
import { Admin, Resource, CustomRoutes } from 'react-admin';
import dataProvider from './dataProvider';
import authProvider from './authProvider';
import Dashboard from './Dashboard';
import MyLayout from './MyLayout';
import contracts from './contracts/index';
import DescriptionIcon from '@mui/icons-material/Description';
import SignInUpPage from './SignInUpPage';
import Profile from './ProfilePage';
import { Route } from "react-router-dom";

function App() {
  return (
    <Admin
      loginPage={SignInUpPage}
      //dashboard={Dashboard}
      authProvider={authProvider}
      dataProvider={dataProvider}
      layout={MyLayout}>
      <Resource 
        name="contracts"
        {...contracts} 
        icon={DescriptionIcon}
        recordRepresentation={(record) => `${record.contractParams.contractName}`}
      />
      <CustomRoutes>
          <Route path="/profile" element={<Profile />} />
      </CustomRoutes>
    </Admin>
  )
}

export default App;
