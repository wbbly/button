import React, { Component } from "react";
import "./style.css";
import * as moment from "moment";
import browser from "webextension-polyfill";

const defaultValues = {
  days: {
    from: "1",
    to: "30"
  },
  hours: {
    from: "1",
    to: "24"
  },
  minutes: {
    from: "1",
    to: "60"
  },
  milisecondsConvert: {
    days: 86400000,
    hours: 3600000,
    minutes: 60000
  }
};

class SettingsNotifications extends Component {
  state = {
    allowNotifications: true,
    timeFrom: "09:00",
    timeTo: "18:00",
    intervalTime: "days",
    intervalValue: "3",
    isShowed: false
  };
  dateRangeChange = e => {
    let changedRange = e.target.id;

    this.setState({ [changedRange]: e.target.value });
  };
  changeIntervalValue = e => {
    const { intervalTime, intervalValue } = this.state;
    if (
      +e.target.value > +defaultValues[intervalTime].to ||
      +e.target.value < 0
    ) {
      return;
    } else {
      this.setState({ intervalValue: e.target.value });
    }
  };
  changeIntervalTime = e => {
    const { intervalValue } = this.state;
    this.setState({ intervalTime: e.target.value });
    if (+intervalValue > +defaultValues[e.target.value].to) {
      this.setState({
        intervalValue: defaultValues[e.target.value].to
      });
    }
  };
  handleConfirm = () => {
    const {
      timeFrom,
      timeTo,
      intervalTime,
      intervalValue,
      allowNotifications,
      isShowed
    } = this.state;
    if (timeFrom === timeTo) {
      alert("Time range is incorrect");
      return;
    } else if (timeFrom === "" || timeTo === "" || +intervalValue === 0) {
      alert("Please fill all time inputs");
      return;
    } else {
      let notificationInfo = {
        allowNotifications,
        timeRange: {
          timeFrom,
          timeTo
        },
        notificationDelay: {
          value: intervalValue * defaultValues.milisecondsConvert[intervalTime],
          format: intervalTime
        },
        isShowed
      };
      browser.storage.sync.set({ notificationInfo });
      if(allowNotifications) {
        alert("Reminder added");
      }
      else {
        alert("Reminder disabled");
      }
    }
  };
  componentDidUpdate(prevProps) {
    if (this.props.info !== prevProps.info) {
      const { info } = this.props;
      this.setState({
        allowNotifications: info.allowNotifications,
        timeFrom: info.timeRange.timeFrom,
        timeTo: info.timeRange.timeTo,
        intervalTime: info.notificationDelay.format,
        intervalValue:
          info.notificationDelay.value /
          defaultValues.milisecondsConvert[info.notificationDelay.format],
        isShowed: info.isShowed
      });
    }
  }
  render() {
    const {
      allowNotifications,
      timeFrom,
      timeTo,
      intervalTime,
      intervalValue
    } = this.state;
    return (
      <section className="settings-notifications">
        <h1>Notifications</h1>
        <div className="settings-notifications-allow">
          <label for="notificationsAllow">Allow notifications</label>
          <input
            type="checkbox"
            id="notificationsAllow"
            value="notificationsAllow"
            onChange={() =>
              this.setState({ allowNotifications: !allowNotifications })
            }
            checked={allowNotifications}
          />
        </div>
        <div className="settings-notifications-customize">
          <div className="settings-notifications-customize-time">
            <div className="value-from">
              <div>Remind me to start timer from:</div>
              <input
                type="time"
                id="timeFrom"
                value={timeFrom}
                onChange={this.dateRangeChange}
              />
            </div>
            <div className="value-to">
              <div>to:</div>
              <input
                type="time"
                id="timeTo"
                value={timeTo}
                onChange={this.dateRangeChange}
              />
            </div>
          </div>
          <div className="settings-notifications-customize-interval">
            <div>after</div>
            <input
              type="number"
              min={defaultValues[intervalTime].from}
              max={defaultValues[intervalTime].to}
              value={intervalValue}
              onChange={this.changeIntervalValue}
            />
            <select value={intervalTime} onChange={this.changeIntervalTime}>
              <option value="minutes">minutes</option>
              <option value="hours">hours</option>
              <option value="days">days</option>
            </select>
            <div>from last timer stop</div>
          </div>
          {!allowNotifications && (
            <div className="settings-notifications-blocked" />
          )}
        </div>
        <button onClick={this.handleConfirm}>Confirm</button>
      </section>
    );
  }
}
export default SettingsNotifications;
