


import { api } from "./config/axiosConfig"
import { defineCancelApiObject } from "./config/axiosUtils"

export const NnauruAPI = {
    get: async function (user, url, cancel = false) {
        const headers = {'content-type': 'application/json', 'Authorization': 'Basic ' + user};
        const instanceId = localStorage.getItem('instanceId');
        if (instanceId) headers['x-instance-id'] = instanceId;

        const response = await api.request({
            url: url,
            headers: headers, 
            method: "GET",
            //signal: cancel ? cancelApiObject[this.get.name].handleRequestCancellation().signal : undefined, (à creuser !)
        })

        return response.data;
    },
    post: async function (user, url, data, cancel = false) {
        const headers = {'content-type': 'application/json', 'Authorization': 'Basic ' + user};
        const instanceId = localStorage.getItem('instanceId');
        if (instanceId) headers['x-instance-id'] = instanceId;

        const response = await api.request({
            url: url,
            headers: headers, 
            method: "POST",
            data: data
            //signal: cancel ? cancelApiObject[this.get.name].handleRequestCancellation().signal : undefined, (à creuser !)
        })

        
        /*console.log("----------------------------------------------------------------------");
        console.log("request : ", url);
        console.log("status : ", response.status);
        console.log("datas : ", response.data);
        console.log("----------------------------------------------------------------------");*/

        return response.data;
    },
    delete: async function (user, url, cancel = false) {
        const headers = {'content-type': 'application/json', 'Authorization': 'Basic ' + user};
        const instanceId = localStorage.getItem('instanceId');
        if (instanceId) headers['x-instance-id'] = instanceId;

        const response = await api.request({
            url: url,
            headers: headers, 
            method: "DELETE"
            //signal: cancel ? cancelApiObject[this.get.name].handleRequestCancellation().signal : undefined, (à creuser !)
        })

        /*console.log("----------------------------------------------------------------------");
        console.log("request : ", url);
        console.log("status : ", response.status);
        console.log("datas : ", response.data);
        console.log("----------------------------------------------------------------------");*/

        return response.data;
    },
}

// defining the cancel API object for ProductAPI
const cancelApiObject = defineCancelApiObject(NnauruAPI)
