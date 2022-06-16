import React, { Component } from 'react';
import './style.css';

import browser from 'webextension-polyfill';
import { Scrollbars } from 'react-custom-scrollbars';
import * as moment from 'moment';

import playSVG from '../../images/icons/play.svg'
import editSVG from '../../images/icons/baseline-create-24px.svg'
import { timerDuration } from '../../service/timeServises'
import NewTimerComponent from '../NewTimerComponent';

class TimerHistoryComponent extends Component{
    state = {
        todayTimers: null,
        yesterdayTimers: null,
        triggerTaskComponent: false,
        editedTask: null
    }
    componentWillMount(){
        this.splitProjectsByDates(this.props.timerHistory)
    }
    componentWillReceiveProps(nextProps){
        this.splitProjectsByDates(nextProps.timerHistory)
    }
    splitProjectsByDates(items = []) {
        const formattedLogsDates = [];
        const formattedLogsDatesValues = [];

        for (let i = 0; i < items.length; i++) {
            const date = moment(items[i].start_datetime).format('YYYY-MM-DD');
            let index = formattedLogsDates.indexOf(date);
            if (index === -1) {
                formattedLogsDates.push(date);
                index = formattedLogsDates.length - 1;
            }

            if (typeof formattedLogsDatesValues[index] === 'undefined') {
                formattedLogsDatesValues[index] = [];
            }

            formattedLogsDatesValues[index].push(items[i]);
        }
        if(moment(formattedLogsDatesValues[0][0].start_datetime).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')){
            this.setState({
                todayTimers: formattedLogsDatesValues[0],
                yesterdayTimers: formattedLogsDatesValues[1]
            })
        }
        else{
            this.setState({
                yesterdayTimers: formattedLogsDatesValues[0]
            })
        }
    }
    getTotalTime = (arr) => {
        let totalTime = 0
        arr.forEach((item) => {
            totalTime += this.getTaskTime(item.start_datetime, item.end_datetime)
        })
        return totalTime
    }
    getTaskTime = (start, end) => {
        return +moment(end) - +moment(start)
    }
    startTimer = (event) => {
        let searchElem = this.props.timerHistory.find((item) => {
            return item.id === event.target.id
        })
        if(searchElem){
            browser.runtime.sendMessage({type: 'timer-start', data: {
                project: searchElem.project.id,
                issue: searchElem.issue
            }})
            window.close()
        }
    }
    editSelectedTask = (task) => {
        this.setState({editedTask: task, triggerTaskComponent: true})
    }
    showEditButton = event => {
        let targetButton = event.currentTarget.childNodes[0]
        let targetTask = event.currentTarget.childNodes[1]
        let swipedTasks = document.querySelectorAll('.task-moved')
        let activeButtons = document.querySelectorAll('.img-visible')
        swipedTasks.length > 0 && swipedTasks.forEach((elem) => {
            elem.classList.remove('task-moved')
        })
        activeButtons.length > 0 && activeButtons.forEach((elem) => {
            elem.classList.remove('img-visible')
        })
        targetButton.classList.add('img-visible')
        targetTask.classList.add('task-moved')
    }
    hideEditButton = event => {
        let swipedTasks = document.querySelectorAll('.task-moved')
        let activeButtons = document.querySelectorAll('.img-visible')
        swipedTasks.length > 0 && swipedTasks.forEach((elem) => {
            elem.classList.remove('task-moved')
        })
        activeButtons.length > 0 && activeButtons.forEach((elem) => {
            elem.classList.remove('img-visible')
        })
    }

    render(){
        const { todayTimers, yesterdayTimers, triggerTaskComponent, editedTask } = this.state
        return(
            triggerTaskComponent ? <NewTimerComponent projectsList={this.props.projectsList} moveBack={() => this.setState({triggerTaskComponent: false, editedTask: null})} editedTask={editedTask}/> : 
                (<div className="projects-history">
                    <div className="projects-container">
                        <p>Today: {todayTimers && timerDuration(this.getTotalTime(todayTimers))}</p>
                        <ul>
                            <Scrollbars autoHeight autoHeightMin={40} autoHeightMax={160}>
                                {!todayTimers ?  
                                    <li>There are no timers today</li>
                                    :
                                    todayTimers.map((item) => (
                                        <li>
                                            <div 
                                                onMouseOver={this.showEditButton}
                                                onMouseOut={this.hideEditButton}
                                                className="task-name"
                                                title={`${item.issue} • ${item.project.name}`}
                                            >
                                                <div className="edit-button">
                                                    <img src={editSVG} onClick={(e) => this.editSelectedTask(item)}/>
                                                </div>
                                                <span className="task-name-text">{item.issue} • {item.project.name}</span></div>
                                            <div className="task-controls">
                                                 <div>{timerDuration(this.getTaskTime(item.start_datetime, item.end_datetime))}</div>
                                                 <img id={item.id} src={playSVG} onClick={this.startTimer}/>
                                            </div>
                                        </li>
                                    ))
                                }
                            </Scrollbars>
                        </ul>
                    </div>
                    {yesterdayTimers && (
                        <div className="projects-container">
                            <div className="time-history-container">
                                <p>{moment(yesterdayTimers[0].start_datetime).format('DD.MM.YYYY')}</p>
                                <p>Total time: {timerDuration(this.getTotalTime(yesterdayTimers))}</p>
                            </div>
                            <ul>
                                <Scrollbars autoHeight autoHeightMin={40} autoHeightMax={160}>
                                    {yesterdayTimers && yesterdayTimers.map((item) => (
                                        <li>
                                            <div 
                                                onMouseOver={this.showEditButton}
                                                onMouseOut={this.hideEditButton}
                                                className="task-name"
                                                title={`${item.issue} • ${item.project.name}`}
                                            >
                                                <div className="edit-button">
                                                    <img src={editSVG} onClick={(e) => this.editSelectedTask(item)}/>
                                                </div>
                                                <span className="task-name-text">{item.issue} • {item.project.name}</span></div>
                                            <div className="task-controls">
                                                <div>{timerDuration(this.getTaskTime(item.start_datetime, item.end_datetime))}</div>
                                                <img id={item.id} src={playSVG} onClick={this.startTimer}/>
                                            </div>
                                        </li>
                                    ))}
                                </Scrollbars>
                            </ul>
                        </div>
                    )}
                    <button onClick={() => this.setState({triggerTaskComponent: true})}>Start new timer</button>
                </div>)
        )
    }
}
export default TimerHistoryComponent