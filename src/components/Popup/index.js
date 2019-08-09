import React, { Component } from 'react';
import './style.css';
import browser from 'webextension-polyfill';
import logo from '../../images/icons/logo.svg'
import exitSVG from '../../images/icons/sign-out-alt-solid.svg'

class Popup extends Component {
    state = {
        isAuth: false,
        currentTimer: null
    }
    componentWillMount(){
        browser.storage.local.get(['token']).then((res) => {
                if (res.token){
                    this.setState({isAuth: true})
                }
        })
        browser.storage.local.get(['currentTimer']).then((res) => {
            if (res.currentTimer){
                this.setState({currentTimer: res.currentTimer})
            }
            else {
                this.setState({currentTimer: null})
            }
        })
    }
    logout = () => {
        browser.storage.local.clear()
        this.setState({isAuth: false})
        window.close();
    }
    login = () => {
        browser.runtime.sendMessage({type: 'auth'})
    }
    render(){
        return(
            <div className={this.state.isAuth && !this.state.currentTimer ? "container-small" : "container"}>
                <header>
                    <img src={logo} />
                    {this.state.isAuth ? <img src={exitSVG} className="exit-button" onClick={this.logout} /> : null}
                </header>
                {!this.state.isAuth ? 
                <div className="wrapper">
                    <h1>Greetings from Wobbly Button</h1>
                    <p>Click the Login button to access your Wobbly account</p>
                    <button onClick={this.login}>Login</button>
                </div> : 
                    this.state.currentTimer ? 
                    <div className="wrapper">
                        <p className="current-timer"><span>Timer started:</span></p>
                        <p className="current-timer">{decodeURI(this.state.currentTimer.issue)}</p> 
                    </div>
                    : null
                }
            </div>
        )
    }
}
export default Popup;