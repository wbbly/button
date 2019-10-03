/*global chrome*/
import openSocket from 'socket.io-client';
import { AppConfig } from './config.js'
import originHosts from './originHosts'
import * as moment from 'moment';

let socketConnection = null

window.wobblyButton = {
    user: {
        token: null
    },
    currentTimer: null,
    userAuth: false,
    projectList: null,
    timerHistory: null,
    contentTabs: [],
    customHostList: [],
    originHostList: [],
    origins: null,
    wobblyLogin: function(tabID, changeInfo, tab){
        if (!wobblyButton.userAuth && tab.url.indexOf('wobbly.me') > 0 && changeInfo.status === 'complete'){
            chrome.tabs.executeScript(tabID, {file: 'scripts/content-scripts/wobbly.js'})
            chrome.tabs.onRemoved.addListener(() => {
                chrome.tabs.onUpdated.removeListener(wobblyButton.wobblyLogin)
            })
        }
    },
    tabUpdated: async function (tabID, changeInfo, tab) {
        if (wobblyButton.userAuth && wobblyButton.checkTabForPermissions(tab.url) && changeInfo.status === 'complete'){
            if(wobblyButton.contentTabs.indexOf(tabID) < 0){
                wobblyButton.contentTabs.push(tabID)
            }
            await wobblyButton.getProjectList()
            chrome.tabs.executeScript(tabID, {file: 'scripts/content.js'})
            chrome.tabs.executeScript(tabID, {file: `scripts/content-scripts/${wobblyButton.getExecutedScript(tab.url)}`}, () => {
                wobblyButton.contentTabs.forEach((tab) => {
                    chrome.tabs.sendMessage(tab, {type: 'timer-data', data: wobblyButton.currentTimer, projects: wobblyButton.projectList});
                })
            })
            chrome.tabs.insertCSS(tabID, {file: 'form-style.css'})           
        }

    },
    apiCall: function (url, params = { method: 'GET' }, withAuth = true){
        params['headers'] = params['headers'] || {};
        if (withAuth) {
            params.headers['Authorization'] = `Bearer ${wobblyButton.user.token}`;
        }
        return new Promise((resolve, reject) => {
            fetch(url, params).then(
                res => {
                    if (!res.ok) {
                        if (res.status === 401) {
                            wobblyButton.logout()
                        }
                        return reject(res);
                    }
                    return resolve(res.json());
                },
                err => reject(err)
            );
        });
    },
    getBrowserStorageData: function(type){
        chrome.storage.local.get([type], (data) => {
            if(data.token){
                wobblyButton.user.token = data.token
                wobblyButton.userAuth = true
                wobblyButton.initSocketConnection()
            }
            else{
                chrome.browserAction.setIcon({path: "images/favicon_g.png"});
            }
        })
    },
    getProjectList: function(){
        return new Promise((resolve) => {
            wobblyButton.apiCall(`${AppConfig.apiURL}project/list`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }).then(
                result => {
                    chrome.storage.local.set({projects: result.data.project_v2})
                    wobblyButton.projectList = result.data.project_v2
                    resolve(true);
                }
            );
        });
    },
    getUserHistory: function(){
        return new Promise((resolve) => {
            wobblyButton.userAuth && wobblyButton.apiCall(`${AppConfig.apiURL}timer/user-list`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }).then(
                result => {
                    wobblyButton.timerHistory = result.data.timer_v2
                    resolve(result.data.timer_v2);
                }
            );
        });
    },
    initSocketConnection: function(){
        socketConnection = openSocket(AppConfig.apiURL)
        socketConnection.on('connect', () => {
            socketConnection.emit(
                'join-v2',
                {
                    token: `Bearer ${wobblyButton.user.token}`,
                },
                _ => {
                    wobblyButton.getProjectList()
                    wobblyButton.getUserHistory()
                    socketConnection.emit('check-timer-v2', {
                        token: `Bearer ${wobblyButton.user.token}`,
                    }, (res) => {
                        if(res === 'Unauthorized'){
                            wobblyButton.logout()
                        }
                    });
                }
            );
        })
        socketConnection.on('check-timer-v2', data => {
            wobblyButton.currentTimer = data
            if(data){
                wobblyButton.apiCall(AppConfig.apiURL + 'time/current', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }).then(res => {
                    let timeDiff = +moment(res.timeISO) - +moment()
                    data.timeDiff = timeDiff
                    chrome.storage.local.set({currentTimer: data})
                    chrome.browserAction.setIcon({path: "images/favicon-active.png"});
                    chrome.runtime.sendMessage({type: 'timer-data', data})
                    wobblyButton.contentTabs.forEach((tab) => {
                        chrome.tabs.sendMessage(tab, {type: 'timer-data', data, projects: wobblyButton.projectList });
                    })
                }, 
                err => console.log(err)
                )
            }
        })
        socketConnection.on('stop-timer-v2', data => {
            wobblyButton.currentTimer = null
            wobblyButton.getUserHistory()
            chrome.browserAction.setIcon({path: "images/favicon.png"});
            chrome.storage.local.remove(['currentTimer'])
            wobblyButton.contentTabs.forEach((tab) => {
                chrome.tabs.sendMessage(tab, {type: 'timer-stop'});
            })
        })
        socketConnection.on('user-unauthorized', data => {
            wobblyButton.logout()
        })
        
    },
    logout: function(){
        wobblyButton.userAuth = false
        wobblyButton.user.token = null
        chrome.browserAction.setIcon({path: "images/favicon_g.png"})
        chrome.storage.local.clear()
        socketConnection.close()
        socketConnection.emit('leave')
    },
    checkTabForPermissions: function(url){
        if (!wobblyButton.origins) return false
        return wobblyButton.origins.some((item) => url.indexOf(item.host) > -1)
    },
    getExecutedScript: function(url){
        let scriptFile
        wobblyButton.origins.forEach((item) => {
            if(url.indexOf(item.host) > -1){               
                scriptFile =  originHosts[item.integration].file
            }
        })
        return scriptFile
    }
}

wobblyButton.getBrowserStorageData('token')

chrome.storage.local.get(['customIntegrations', 'originIntegrations'], res => {
        wobblyButton.customHostList = res.customIntegrations || []
        wobblyButton.originHostList = res.originIntegrations || []
        wobblyButton.origins = wobblyButton.customHostList.concat(wobblyButton.originHostList)
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if(request.type === 'auth'){
        chrome.tabs.onUpdated.addListener(wobblyButton.wobblyLogin)
        chrome.tabs.create({url: 'https://time.wobbly.me/login'})
    }
    else if(request.type === 'wobbly-access'){
        wobblyButton.userAuth = true
        wobblyButton.user.token = request.token
        chrome.browserAction.setIcon({path: "images/favicon.png"})
        chrome.storage.local.set({token: request.token})
        chrome.tabs.remove(sender.tab.id)
        wobblyButton.initSocketConnection()
    }
    else if(request.type === 'auth-check'){
        wobblyButton.userAuth = false
    }
    else if(request.type === 'timer-start'){
        socketConnection.emit('start-timer-v2', {
            token: `Bearer ${wobblyButton.user.token}`,
            issue: request.data.issue,
            projectId: request.data.project,
        })
    }
    else if(request.type === 'timer-stop'){
        socketConnection.emit('stop-timer-v2', {
            token: `Bearer ${wobblyButton.user.token}`
        })
    }
    else if(request.type === 'timer-history'){
        wobblyButton.getUserHistory().then((res) => {
            sendResponse({data: res})
        })
        return true
    }
    else if(request.type === 'logout'){
        wobblyButton.logout()
    }
    
})

chrome.storage.onChanged.addListener(function(changes) {
    for (var key in changes) {
        if(key === 'customIntegrations' && changes.customIntegrations.hasOwnProperty('newValue')){
            wobblyButton.customHostList = changes.customIntegrations.newValue
            wobblyButton.origins = wobblyButton.customHostList.concat(wobblyButton.originHostList)

        }
        else if(key === 'originIntegrations' && changes.originIntegrations.hasOwnProperty('newValue')){
            wobblyButton.originHostList = changes.originIntegrations.newValue
            wobblyButton.origins = wobblyButton.customHostList.concat(wobblyButton.originHostList)
        }
    }
})

chrome.tabs.onUpdated.addListener(wobblyButton.tabUpdated)

chrome.tabs.onRemoved.addListener((tabId) => {
    var index = wobblyButton.contentTabs.indexOf(tabId)
    if(index > -1){
        wobblyButton.contentTabs.splice(index, 1)
    }
})