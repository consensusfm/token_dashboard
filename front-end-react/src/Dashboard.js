import * as React from "react";
import { Card, CardContent, CardHeader } from '@mui/material';
import {
    LineChart,
    Line,
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts';

//const data = [{name: 'Page A', uv: 400, pv: 2400, amt: 2400}];
const data = [
    {t: "t1", p: 400}, 
    {t: "t2", p: 500},
    {t: "t3", p: 200},
    {t: "t4", p: 100},
    {t: "t5", p: 800},
    {t: "t6", p: 900}
];

const Dashboard = () => (
    <Card>
        <CardHeader title="Welcome to the token generator" />
        <CardContent>
            Some info about contracts...
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <LineChart width={600} height={300} data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <Line type="monotone" dataKey="p" stroke="#8884d8" />
                        <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                        <XAxis dataKey="t" />
                        <YAxis />
                        <Tooltip />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </CardContent>
    </Card>
);

export default Dashboard;