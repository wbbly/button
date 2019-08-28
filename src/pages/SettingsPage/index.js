import React, { Component } from 'react';
import './style.css';
import browser from 'webextension-polyfill';
import originHosts from '../../originHosts'

class SettingsPage extends Component{
    state = {
        integration: 'jira.com',
        customHost: '',
        activeIntegrations: null,
        originIntegrations: []
    }
    componentWillMount(){
        document.body.style.backgroundColor = 'white'
        browser.storage.local.get(['customIntegrations']).then((res) => {
            if(res.customIntegrations && res.customIntegrations.length !== 0){
                this.setState({activeIntegrations: res.customIntegrations})
            }
        })
        browser.storage.local.get(['originIntegrations']).then((res) => {
            if(res.originIntegrations && res.originIntegrations.length !== 0){
                this.setState({originIntegrations: res.originIntegrations})
            }
        })
    }
    componentDidMount(){
        browser.storage.onChanged.addListener((changes) => {
            for (var key in changes) {
                if(key === 'customIntegrations' && changes.customIntegrations.hasOwnProperty('newValue')){
                    if(changes.customIntegrations.newValue.length === 0){
                        this.setState({activeIntegrations: null})
                        return
                    }
                    this.setState({activeIntegrations: changes.customIntegrations.newValue})
                }
                else if(key === 'originIntegrations' && changes.originIntegrations.hasOwnProperty('newValue')){
                    if(changes.originIntegrations.newValue.length === 0){
                        this.setState({originIntegrations: []})
                        return
                    }
                    this.setState({originIntegrations: changes.originIntegrations.newValue})
                }
            }        
        })
        browser.runtime.onMessage.addListener((request, sender) => {
            if (request.type === "logout") {
                window.close()
            }
        })
    }
    handleSubmit = (e) => {
        e.preventDefault()
        const { integration, customHost, activeIntegrations } = this.state
        if(!activeIntegrations && this.validateHost(customHost)){
            browser.permissions.request({origins: [`*://${customHost}/*`]}).then((res) => {
                if(res){
                    browser.storage.local.set({customIntegrations: [{integration, host: customHost}]})
                }
                else return
            })
        }
        else if(this.validateHost(customHost)) {
            browser.permissions.request({origins: [`*://${customHost}/*`]}).then((res) => {
                if(res){
                    activeIntegrations.push({integration, host: customHost})
                    browser.storage.local.set({customIntegrations: activeIntegrations})
                }
                else return
            })
        }
        else return

    }
    deleteHostItem = (e) => {
        const { activeIntegrations } = this.state
        let filteredArr = activeIntegrations.filter((item) => {
            if(item.host !== e.target.previousSibling.id) return true
            else{
                browser.permissions.remove({origins: [`*://${item.host}/*`]})
                return false
            }
        })
        browser.storage.local.set({customIntegrations: filteredArr})
    }
    validateHost = (host) => {
        const { activeIntegrations } = this.state
        if (activeIntegrations && activeIntegrations.some((item) => item.host === host)){
            alert('Already have this custom host')
            return false
        }
        return true
    }
    handleChange = (e) => {
        const { originIntegrations } = this.state
        let targetValue = e.target.value
        if(e.target.checked){
            browser.permissions.request({origins: [`*://*.${targetValue}/*`]}).then((res) => {
                if(res){
                    originIntegrations.push({integration: targetValue, host: targetValue})
                    browser.storage.local.set({originIntegrations: originIntegrations})
                }
                else return
            })
        }
        else if(!e.target.checked){
            browser.permissions.remove({origins: [`*://*.${targetValue}/*`]})
            let filteredArr = originIntegrations.filter((item) => item.host !== targetValue)
            browser.storage.local.set({originIntegrations: filteredArr})
        }
    }
    checkForActiveIntegration = (integration) => {
        const { originIntegrations } = this.state
        if(!originIntegrations) return false
        return originIntegrations.some((item) => item.host === integration)
    }
    render(){
        const { customHost, integration, activeIntegrations } = this.state
        return(
            <>
                <header className="settings-header">
                    <div>Integrations</div>     
                </header>
                <main className="settings-wrapper">
                    <section className="settings-integrations">
                        <h1>Integrations</h1>
                        <ul className="host-list">
                            {Object.keys(originHosts).map((key) => (
                                <li className="origin-host-item" key={key}>
                                    <input type="checkbox"
                                        id = {key} 
                                        value={key}
                                        onChange={this.handleChange}
                                        checked={this.checkForActiveIntegration(key)}
                                    /> 
                                    <label for={key}>{originHosts[key].name} <span>- {key}</span></label>
                                </li>
                            ))}
                        </ul>
                    </section>
                    <section className="settings-integrations">
                        <h1>Custom integrations</h1>
                        <p>If you use a tool hosted on a custom domain, you can enable it here. Enter the domain name in the format "wobbly.me" and select the integration from the dropdown. <span>Ports are not supported.</span></p>
                        <form className="settings-host" onSubmit={this.handleSubmit}>
                            <input 
                                id="host-url" 
                                type="text" 
                                placeholder="Enter custom domain url" 
                                value={customHost}
                                onChange={(e) => this.setState({customHost: e.target.value})}
                            />
                            <div>
                                <select value={integration} onChange={(e) => this.setState({integration: e.target.value})}>
                                    <option value="jira.com">Jira</option>
                                </select>
                                <input id="submit-btn" type="submit" value="Add"/>
                            </div>
                        </form>
                        {activeIntegrations && 
                            (<ul className="host-list">
                                {activeIntegrations.map((item) => (
                                    <li className="host-item" key={item.host}>
                                        <div id={item.host}>{item.host} <span>- {item.integration}</span></div>
                                        <button onClick={this.deleteHostItem}>delete</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </main>
            </>
        )
    }
}
export default SettingsPage