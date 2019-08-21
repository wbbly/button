import React, { Component } from 'react';
import './style.css';
import browser from 'webextension-polyfill';

import logo from '../../images/icons/logo.svg'
import exitSVG from '../../images/icons/sign-out-alt-solid.svg'
import stopSVG from '../../images/icons/stop.svg'

import TimerHistoryComponent from '../TimerHistoryComponent';
import { timerDuration } from '../../service/timeServises' 

class Popup extends Component {
    constructor(props){
        super(props)
        browser.runtime.onMessage.addListener((request, sender) => {
            if (request.type === "timer-data") {
                this.setState({currentTimer: request.data})
                this.getCurrentTimerDuration()
                this.timerTick()
            }
        })
    }
    TIMER_LIVE;
    state = {
        isAuth: false,
        currentTimer: null,
        timer: null,
        projectsList: null,
        timerHistory: null
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
                this.getCurrentTimerDuration()
                this.timerTick()
            }
            else {
                this.setState({currentTimer: null})
            }
        })
        browser.storage.local.get(['projects']).then((res) => {
            if (res.projects){
                this.setState({projectsList: res.projects})
            }
            else {
                this.setState({projectsList: null})
            }
        })
        this.getTimerHistory()
    }
    getTimerHistory = () => {
        browser.runtime.sendMessage({type: 'timer-history'}).then((res) => {
            if(res){
                this.setState({timerHistory: res.data})
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
    timerTick = () => {
        this.TIMER_LIVE = setInterval(() => {
            this.getCurrentTimerDuration()
        },1000)
    }
    getCurrentTimerDuration = () => {
        let now = new Date()
        let currentTimerDuration = Date.parse(now) - Date.parse(this.state.currentTimer.startDatetime)
        this.setState({timer: currentTimerDuration})
    }
    stopTimer = () => {
        browser.runtime.sendMessage({type: 'timer-stop'})
        this.setState({currentTimer: null, timer: null})
        clearTimeout(this.TIMER_LIVE)
        window.close()
    }
    componentWillUnmount(){
        clearTimeout(this.TIMER_LIVE)
    }
    render(){
        return(
            <div className="container">
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
                        <div className="task-item">
                            <p className="current-timer">{decodeURI(this.state.currentTimer.issue)} • {this.state.currentTimer.project.name}</p>
                            <div className="time-container">
                                <p>{timerDuration(this.state.timer)}</p>
                                <img src={stopSVG} onClick={this.stopTimer} />
                            </div>
                        </div>
                    </div>
                    : 
                    <div className="wrapper">
                        {this.state.timerHistory && <TimerHistoryComponent timerHistory={this.state.timerHistory} projectsList={this.state.projectsList}/>}
                    </div>
                    
                }
            </div>
        )
    }
}
export default Popup;