/*global chrome*/
import openSocket from 'socket.io-client';
import { AppConfig } from './config.js'
import originHosts from './originHosts'
import * as moment from 'moment';

let socketConnection = null

let defaultNotificationInfo = {
    allowNotifications: true,
    timeRange: {
        timeFrom: '09:00',
        timeTo: '18:00'
    },
    notificationDelay: {
        value: 259200000,
        // value: 30000,
        format: 'days'
    },
    isShowed: false
}

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
    notificationInfo: null,
    activeNotificationTimer: null,
    defaultProject: "f339b6b6-d044-44f3-8887-684e112f7cfd",
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
                wobblyButton.createContextMenu()
                wobblyButton.initSocketConnection()
            }
            else{
                chrome.browserAction.setIcon({path: "images/favicon_g.png"});
            }
        })
    },
    getBrowserNotificationsInfo: function(){
        chrome.storage.local.get('notificationInfo', (res) => {
            if(res.notificationInfo){
                wobblyButton.notificationInfo = wobblyButton.userAuth ? res.notificationInfo : defaultNotificationInfo
            }
            else{
                wobblyButton.notificationInfo = defaultNotificationInfo
                chrome.storage.local.set({ notificationInfo: defaultNotificationInfo });
            }
        })
        !wobblyButton.userAuth && chrome.storage.local.get('unauthTimerStart', (res) => {
            if(!res.unauthTimerStart){
                let startDelay = moment().set({hour:12,minute:0,second:0,millisecond:0}).format()
                chrome.storage.local.set({ unauthTimerStart: startDelay})
                wobblyButton.startNotificationDelay(startDelay)
            } else {
                wobblyButton.startNotificationDelay(res.unauthTimerStart)
            }
        })

    },
    getProjectList: function(){
        return new Promise((resolve) => {
            wobblyButton.apiCall(`${AppConfig.apiURL}project/list?withJiraProject=true&slugSync=jira`, {
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
                    wobblyButton.contentTabs.forEach((tab) => {
                        chrome.tabs.sendMessage(tab, {type: 'timer-ready'});
                    })
                    !wobblyButton.notificationInfo.isShowed && wobblyButton.notificationInfo.allowNotifications && wobblyButton.startNotificationDelay(result.data.timer_v2[0].end_datetime || moment().format())
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
            if(data){
                wobblyButton.currentTimer = data
                wobblyButton.apiCall(AppConfig.apiURL + 'time/current', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }).then(res => {
                    let timeDiff = +moment(res.timeISO) - +moment()
                    data.timeDiff = timeDiff
                    chrome.storage.local.set({currentTimer: data})
                    clearTimeout(wobblyButton.activeNotificationTimer)
                    wobblyButton.activeNotificationTimer = null
                    wobblyButton.notificationInfo.isShowed = true
                    chrome.storage.local.set({ notificationInfo: wobblyButton.notificationInfo});
                    chrome.browserAction.setIcon({path: "images/favicon-active.png"});
                    chrome.runtime.sendMessage({type: 'timer-data', data})
                    wobblyButton.contentTabs.forEach((tab) => {
                        chrome.tabs.sendMessage(tab, {type: 'timer-data', data, projects: wobblyButton.projectList });
                    })
                }, 
                err => console.log(err)
                )
            }
            else if(wobblyButton.currentTimer){
                wobblyButton.currentTimer = null
                wobblyButton.notificationInfo.isShowed = false
                chrome.storage.local.set({ notificationInfo: wobblyButton.notificationInfo});
                wobblyButton.getUserHistory()
                chrome.browserAction.setIcon({path: "images/favicon.png"});
                chrome.storage.local.remove(['currentTimer'])
                wobblyButton.contentTabs.forEach((tab) => {
                    chrome.tabs.sendMessage(tab, {type: 'timer-stop'});
                })
    
            }
            else {
                wobblyButton.currentTimer = null
            }
        })
        // socketConnection.on('stop-timer-v2', data => {
        //     wobblyButton.currentTimer = null
        //     wobblyButton.notificationInfo.isShowed = false
        //     chrome.storage.local.set({ notificationInfo: wobblyButton.notificationInfo});
        //     wobblyButton.getUserHistory()
        //     chrome.browserAction.setIcon({path: "images/favicon.png"});
        //     chrome.storage.local.remove(['currentTimer'])
        //     wobblyButton.contentTabs.forEach((tab) => {
        //         chrome.tabs.sendMessage(tab, {type: 'timer-stop'});
        //     })
        // })
        socketConnection.on('user-unauthorized', data => {
            wobblyButton.logout()
        })
        
    },
    logout: function(){
        wobblyButton.userAuth = false
        wobblyButton.user.token = null
        chrome.browserAction.setIcon({path: "images/favicon_g.png"})
        chrome.runtime.sendMessage({type: 'user-token', data: false})
        // wobblyButton.activeNotificationTimer = null
        chrome.storage.local.remove(['token', 'unauthTimerStart'])
        socketConnection.close()
        socketConnection.emit('leave')
        chrome.contextMenus.removeAll()
        wobblyButton.getBrowserNotificationsInfo()
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
    },
    showNotification: function(delay){
        wobblyButton.activeNotificationTimer = setTimeout(() => {
            if(wobblyButton.checkForAllowedTimeNotification()){
                let notifId = `notifChrome-${Math.round(Math.random()*100)}`
                chrome.notifications.create(notifId,{message: 'Don`t forgеt to start the timer', title: 'Wobbly Button',type: 'basic', iconUrl: 'images/favicon.svg'})
                // chrome.storage.local.set({ notificationInfo: wobblyButton.notificationInfo})
                restartNotificationTimer()
            }
            else {
                wobblyButton.activeNotificationTimer = null
                wobblyButton.showNotification(delay)
            }
        }, delay)
    },
    startNotificationDelay: function(lastTimerStop){
        if(wobblyButton.currentTimer || wobblyButton.activeNotificationTimer) return
        let settingsDelay = wobblyButton.notificationInfo.notificationDelay.value
        let delay = settingsDelay - (+moment() - +moment(lastTimerStop))
        wobblyButton.showNotification(delay <= 0 ? settingsDelay : delay)
    },
    checkForAllowedTimeNotification: function(){
        const { timeFrom, timeTo } = wobblyButton.notificationInfo.timeRange
        let format = 'hh:mm';
        let time = moment(),
            beforeTime = moment(timeFrom, format),
            afterTime = moment(timeTo, format);
            // beforeTime = time.clone().weekday(1),
            // afterTime = time.clone().weekday(4);

        if (time.isBetween(beforeTime, afterTime)) {
            return true
        } else {
            return false
        }
    },
    createContextMenu: function(){
        chrome.contextMenus && chrome.contextMenus.create({
            title: 'Begin timer with description "%s"',
            contexts: ['selection'],
            onclick: wobblyButton.contextMenuClicked
        })
    },
    contextMenuClicked: function(data){
        socketConnection.emit('start-timer-v2', {
            token: `Bearer ${wobblyButton.user.token}`,
            issue: encodeURI(data.selectionText),
            projectId: wobblyButton.defaultProject,
        })
    },
    editTask: function(data){
        wobblyButton.apiCall(`${AppConfig.apiURL}timer/${data.taskId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                issue: data.issue,
                projectId: data.projectId
            }),
        }).then((response) => {
            wobblyButton.getUserHistory().then((res) => {
                chrome.runtime.sendMessage({type: 'timer-history', data: res})
            })
        },
        (error) => console.log(error))
    }
}

wobblyButton.getBrowserStorageData('token')
wobblyButton.getBrowserNotificationsInfo()

chrome.storage.local.get(['customIntegrations', 'originIntegrations'], res => {
        wobblyButton.customHostList = res.customIntegrations || []
        wobblyButton.originHostList = res.originIntegrations || []
        wobblyButton.origins = wobblyButton.customHostList.concat(wobblyButton.originHostList)
})

let restartNotificationTimer = () => {
    clearTimeout(wobblyButton.activeNotificationTimer)
    wobblyButton.activeNotificationTimer = null
    wobblyButton.showNotification(wobblyButton.notificationInfo.notificationDelay.value)
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if(request.type === 'auth'){
        chrome.tabs.onUpdated.addListener(wobblyButton.wobblyLogin)
        chrome.tabs.create({url: 'https://time.wobbly.me/login'})
    }
    else if(request.type === 'wobbly-access'){
        wobblyButton.activeNotificationTimer && clearTimeout(wobblyButton.activeNotificationTimer)
        wobblyButton.activeNotificationTimer = null
        wobblyButton.userAuth = true
        wobblyButton.createContextMenu()
        wobblyButton.user.token = request.token
        chrome.browserAction.setIcon({path: "images/favicon.png"})
        chrome.storage.local.set({token: request.token})
        localStorage.setItem('userToken',request.token)
        chrome.tabs.remove(sender.tab.id)
        wobblyButton.initSocketConnection()
        wobblyButton.getBrowserNotificationsInfo()
    }
    else if(request.type === 'auth-check'){
        wobblyButton.userAuth = false
    }
    else if(request.type === 'check-for-auth'){
        sendResponse({data: wobblyButton.userAuth})
        return true
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
        wobblyButton.getUserHistory()
    }
    else if(request.type === 'get-timer-history'){
        wobblyButton.getUserHistory().then((res) => {
            sendResponse({data: res})
        })
        return true
    }
    else if(request.type === 'logout'){
        wobblyButton.logout()
    }
    else if(request.type === 'task-edit'){
        wobblyButton.editTask(request.data)
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
        else if(key === 'notificationInfo' && changes.notificationInfo.hasOwnProperty('newValue') && wobblyButton.userAuth){
            wobblyButton.notificationInfo = changes.notificationInfo.newValue
            clearTimeout(wobblyButton.activeNotificationTimer)
            wobblyButton.activeNotificationTimer = null
            wobblyButton.getUserHistory()
            if(!changes.notificationInfo.newValue.allowNotifications && wobblyButton.activeNotificationTimer){
                clearTimeout(wobblyButton.activeNotificationTimer)
                wobblyButton.activeNotificationTimer = null
            }
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
