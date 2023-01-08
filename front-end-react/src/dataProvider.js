import { fetchUtils } from 'react-admin';
import config from './appconf.json';
const apiUrl = config.apiUrl;
const contractLength = 200;

const httpClient = (url, options = {}) => {
    if (!options.headers) {
        options.headers = new Headers({ Accept: 'application/json' });
    }
    const token = localStorage.getItem('token');
    options.headers.set('Authorization', `Bearer ${token}`);
    options.headers.set('userid', localStorage.getItem("userId"));
    return fetchUtils.fetchJson(url, options);
}

const dataProvider = {
    getEthInfoFromEtherscan: () => {
        const ethApiKey = localStorage.getItem("ethApiKey");
        const url = `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${ethApiKey}`;
        var ethData = fetchUtils.fetchJson(url);
        return ethData;
    },
    
    writeContractAddress: (resource, params) => {
        return httpClient(`${apiUrl}/${resource}/${params.id}`, {
            method: 'POST',
            body: JSON.stringify(params),
        }).then(({ json }) => ({
            data: {...params.data, id: json.id },
        }))
    },

    verifyContract: (resource, params) => {
        return httpClient(`${apiUrl}/${resource}/${params.id}`, {
            method: 'POST',
            body: JSON.stringify(params),
        }).then(({ json }) => ({
            data: { ...json }
        }))
    },

    writeUserSettings: (resource, params) => {
        return httpClient(`${apiUrl}/${resource}/${params.id}`, {
            method: 'POST',
            body: JSON.stringify(params),
        }).then(({ json }) => ({
            data: { ...json }
        }))
    },

    getList: (resource, params) => {
        console.log(params);
        const { page, perPage } = params.pagination;
        const { field, order } = params.sort;
        const sort = JSON.stringify([field, order]);
        const range = JSON.stringify([(page - 1) * perPage, page * perPage - 1]);
        const filter = JSON.stringify(params.filter);
        const url = `${apiUrl}/${resource}?sort=${sort}&range=${range}&filter=${filter}`;

        return httpClient(url).then(({ headers, json }) => ({
            data: json.map(resource => (
                {...resource,
                id: resource._id,
                deployed: (resource.address != "null") ? true : false,
                verified: (resource.verificationGuid != "null") ? true : false,
                })),
            total: headers.get("X-Total-Count")
        }));
    },

    getOne: (resource, params) => {
        return httpClient(`${apiUrl}/${resource}/${params.id}`).then(({ json }) => ({
            data: {
                ...json,
                id: json._id,
                code: "contract " + JSON.stringify(json.input.sources.customErc20)
                    .substring(JSON.stringify(json.input.sources.customErc20).length - contractLength)
                    .replaceAll("\\n\\n\\n\"}", "").replaceAll("\\t","\t").replaceAll("\\n","\n").replaceAll("\\", "")
                    .split("contract").slice(-1),
                deployed: (json.address != "null") ? true : false,
                verified: (json.verificationGuid != "null") ? true : false,
            },
        }))
    },

    getMany: (resource, params) => {
        // const query = {
        //     filter: JSON.stringify({ id: params.ids }),
        // };
        const url = `${apiUrl}/${resource}`;
        return httpClient(url).then(({ json }) => ({ 
            data: json.map(resource => ({ ...resource, id: resource._id }) ), 
        }));
    },

    getManyReference: (resource, params) => {
        const { page, perPage } = params.pagination;
        const { field, order } = params.sort;
        // const query = {
        //     sort: JSON.stringify([field, order]),
        //     range: JSON.stringify([(page - 1) * perPage, page * perPage - 1]),
        //     filter: JSON.stringify({
        //         ...params.filter,
        //         [params.target]: params.id,
        //     }),
        // };
        const url = `${apiUrl}/${resource}`;

        return httpClient(url).then(({ headers, json }) => ({
            data: json.map(resource => ({ ...resource, id: resource._id }) ),
            total: json.length
        }));
    },

    update: (resource, params) => {
        // console.log(params.data.contractParams);
        return httpClient(`${apiUrl}/${resource}/${params.id}`, {
            method: 'PUT',
            body: JSON.stringify(params.data.contractParams),
        }).then(({ json }) => ({ 
            data: {...params.data, id: json.id } 
        }))
    },

    // updateMany: (resource, params) => {
    //     const query = {
    //         filter: JSON.stringify({ id: params.ids}),
    //     };
    //     return httpClient(`${apiUrl}/${resource}?${stringify(query)}`, {
    //         method: 'PUT',
    //         body: JSON.stringify(params.data),
    //     }).then(({ json }) => ({ data: json }));
    // },

    create: (resource, params) => 
        //console.log(JSON.stringify(params));
        httpClient(`${apiUrl}/${resource}`, {
            method: 'POST',
            body: JSON.stringify(params.data),
        }).then(({ json }) => ({
            data: {...params.data, id: json.id },
        })),

    delete: (resource, params) =>
        //console.log("Delete one: " + params.id);
        httpClient(`${apiUrl}/${resource}/${params.id}`, {
            method: 'DELETE',
        }).then(({ json }) => ({ 
            data: {...json, id: json._id }, 
        })),

    deleteMany: (resource, params) => {
        console.log("Delete many: " + params.ids);
        // const query = {
        //     filter: JSON.stringify({ id: params.ids}),
        // };
        //return httpClient(`${apiUrl}/${resource}?${stringify(query)}`, {
        return httpClient(`${apiUrl}/${resource}/${params.ids}`, {
            method: 'DELETE',
        }).then(({ json }) => ({ data: json }));
    }
};

export default dataProvider;