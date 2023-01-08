import config from './appconf.json';

const authProvider = {
    register: ({ username, password }) => {
        const request = new Request(config.apiUrl + "/createUser", {
            method: 'POST',
            body: JSON.stringify({ login: username, password: password }),
            headers: new Headers({ 'Content-Type': 'application/json' }),
        })
        return fetch(request)
            .then(response => {
                if (response.status < 200 || response.status >= 300) {
                    throw new Error(response);
                }
                return response.json();
            })
    },
    
    // called when the user attempts to log in
    login: ({ username, password }) => {
        localStorage.setItem('username', username);
        const request = new Request(config.authUrl, {         
        method: 'POST',
        body: JSON.stringify({ login: username, password: password }),
        headers: new Headers({ 'Content-Type': 'application/json' }),
        })
        return fetch(request)
            .then(response => {
                if (response.status < 200 || response.status >= 300) {
                    throw new Error(response.statusText);
                }
                return response.json();
        })
        .then(({ id, ethApiKey, token }) => {
            localStorage.setItem('userId', id);
            localStorage.setItem('ethApiKey', ethApiKey);
            localStorage.setItem('token', token);
        });
    },

    // called when the user clicks on the logout button
    logout: () => {
        localStorage.removeItem('username');
        localStorage.removeItem('userId');
        localStorage.removeItem('ethApiKey');
        localStorage.removeItem('token');
        return Promise.resolve();
    },

    // called when the API returns an error
    checkError: ({ status }) => {
        if (status === 401 || status === 403) {
            localStorage.removeItem('username');
            localStorage.removeItem('userId');
            localStorage.removeItem('ethApiKey');
            localStorage.removeItem('token');
            return Promise.reject();
        }
        return Promise.resolve();
    },

    // called when the user navigates to a new location, to check for authentication
    checkAuth: () => {
        return localStorage.getItem('token')
            ? Promise.resolve()
            : Promise.reject();
    },

    // called when the user navigates to a new location, to check for permissions / roles
    getPermissions: () => Promise.resolve(),
};

export default authProvider;