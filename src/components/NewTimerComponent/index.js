import React, { Component } from 'react';
import './style.css';
import arrowSVG from '../../images/icons/arrow-left-solid.svg'
import browser from 'webextension-polyfill';
import { Scrollbars } from 'react-custom-scrollbars';

class NewTimerComponent extends Component {
    state = {
        showProjectList: false,
        projectList: [],
        selectedProject: {
            name: null,
            id: null
        },
        taskValue: null,
        projectValue: null,
        timerFail: false,
        wrapperRef: null
    }
    handleChange = (event) => {
        this.setState({projectValue: event.target.value})
        if(event.target.value.length){
            let afterSearch = this.props.projectsList.filter(
                obj => obj.name.toLowerCase().indexOf(event.target.value.toLowerCase().trim()) !== -1
            );
            if(event.target.value.length > 0 && afterSearch.length === 0) {
                this.setState({showProjectList: false})
            }
            else {
                this.setState({projectList: afterSearch, showProjectList: true})
            }
        }
        else{
            this.setState({projectList: this.props.projectsList})
        }
    }
    projectPick = (event) => {
        this.setState({
            showProjectList: false,
            selectedProject: {
                id: event.target.id,
                name: event.target.textContent
            },
            projectValue: event.target.textContent
        })
    }
    startTimer = () => {
        if(!this.state.taskValue || !this.state.selectedProject.name){
            this.setState({timerFail: true})
            return
        }
        else if(this.state.projectValue !== this.state.selectedProject.name){
            this.setState({timerFail: true})
            return
        }
        else {
            browser.runtime.sendMessage({type: 'timer-start', data: {
                project: this.state.selectedProject.id,
                issue: encodeURI(this.state.taskValue)
            }})
            window.close()
        }
    }
    setWrapperRef = (node) => {
        this.setState({wrapperRef: node})
    }

    handleClickOutside = (event) => {
        if (this.state.wrapperRef && !this.state.wrapperRef.contains(event.target) && event.target.className !== 'project-input') {
            this.setState({showProjectList: false})
        }
    }
    componentDidMount() {
        document.addEventListener('mousedown', this.handleClickOutside);
    }
    
    componentWillUnmount() {
        document.removeEventListener('mousedown', this.handleClickOutside);
    }
    render(){
        const { showProjectList, projectList, selectedProject, taskValue, projectValue, timerFail } = this.state
        return(
            <div className="project-form">
                <div className="move-back"onClick={this.props.moveBack}>
                    <img src={arrowSVG}/>
                    <span>back</span>
                </div>
                <p>Task Name</p>
                <input 
                    type="text" 
                    placeholder="Enter your task name"
                    className="task-input"
                    style={timerFail && !taskValue ? {borderColor: "red"} : {borderColor: "white"}} 
                    onChange={(e) => this.setState({taskValue: e.target.value, timerFail: false})}
                />
                <p>Project</p>
                <div className="project-select-container">
                <input 
                    className="project-input"
                    type="text" 
                    placeholder="Select your project"
                    value={projectValue}
                    onChange={this.handleChange}
                    style={timerFail && (!projectValue || projectValue !== selectedProject.name) ? {borderColor: "red"} : {borderColor: "white"}}
                    onFocus={() => {
                        this.setState({showProjectList: true, projectList: this.props.projectsList, timerFail: false})
                    }}
                />
                {showProjectList &&
                <ul className="projects-list" ref={this.setWrapperRef}>
                    <Scrollbars autoHeight autoHeightMax={90}>
                    {projectList && projectList.map((project) => (
                        <li key={project.id} id={project.id} onClick={this.projectPick}>{project.name}</li>
                    ))}
                    </Scrollbars>
                </ul>}
                </div>
                <button onClick={this.startTimer}>Start timer</button>
            </div>
        )
    }
}

export default NewTimerComponent