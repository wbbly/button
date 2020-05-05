import React, { Component } from "react";
import "./style.css";
import browser from "webextension-polyfill";
import originHosts from "../../originHosts";
import SettingsNotifications from "../../components/SettingsNotifications";

class SettingsPage extends Component {
  state = {
    integration: "jira.com",
    customHost: "",
    activeIntegrations: null,
    originIntegrations: [],
    notificationInfo: null
  };
  componentWillMount() {
    document.body.style.backgroundColor = "white";
    browser.storage.local.get(["customIntegrations"]).then(res => {
      if (res.customIntegrations && res.customIntegrations.length !== 0) {
        this.setState({ activeIntegrations: res.customIntegrations });
      }
    });
    browser.storage.local.get(["originIntegrations"]).then(res => {
      if (res.originIntegrations && res.originIntegrations.length !== 0) {
        this.setState({ originIntegrations: res.originIntegrations });
      }
    });
    browser.storage.local.get(["notificationInfo"]).then(res => {
      if (res.notificationInfo) {
        this.setState({ notificationInfo: res.notificationInfo });
      }
    });
  }
  componentDidMount() {
    browser.storage.onChanged.addListener(changes => {
      for (var key in changes) {
        if (
          key === "customIntegrations" &&
          changes.customIntegrations.hasOwnProperty("newValue")
        ) {
          if (changes.customIntegrations.newValue.length === 0) {
            this.setState({ activeIntegrations: null });
            return;
          }
          this.setState({
            activeIntegrations: changes.customIntegrations.newValue
          });
        } else if (
          key === "originIntegrations" &&
          changes.originIntegrations.hasOwnProperty("newValue")
        ) {
          if (changes.originIntegrations.newValue.length === 0) {
            this.setState({ originIntegrations: [] });
            return;
          }
          this.setState({
            originIntegrations: changes.originIntegrations.newValue
          });
        }
      }
    });
    browser.runtime.onMessage.addListener((request, sender) => {
      if (request.type === "logout") {
        browser.tabs.getCurrent().then(tab => browser.tabs.remove(tab.id));
      }
    });
  }
  handleSubmit = host => {
    const { integration, activeIntegrations } = this.state;
    if (!activeIntegrations && this.validateHost(host)) {
      browser.permissions.request({ origins: [`*://${host}/*`] }).then(res => {
        if (res) {
          browser.storage.local.set({
            customIntegrations: [{ integration, host: host }]
          });
          this.setState({ customHost: "" });
        } else return;
      });
    } else if (this.validateHost(host)) {
      browser.permissions.request({ origins: [`*://${host}/*`] }).then(res => {
        if (res) {
          activeIntegrations.push({ integration, host: host });
          browser.storage.local.set({ customIntegrations: activeIntegrations });
          this.setState({ customHost: "" });
        } else return;
      });
    } else return;
  };
  deleteHostItem = e => {
    const { activeIntegrations } = this.state;
    let filteredArr = activeIntegrations.filter(item => {
      if (item.host !== e.target.previousSibling.id) return true;
      else {
        browser.permissions.remove({ origins: [`*://${item.host}/*`] });
        return false;
      }
    });
    browser.storage.local.set({ customIntegrations: filteredArr });
  };
  validateHost = host => {
    const { activeIntegrations } = this.state;
    if (!host) {
      return false;
    }
    if (
      activeIntegrations &&
      activeIntegrations.some(item => item.host === host)
    ) {
      alert("Already have this custom host");
      return false;
    }
    if (
      host.search(/[!@#$%^&*(),+/:`?"\\\]\[{}|<>]/g) > -1 ||
      host.slice(-1) === "."
    ) {
      alert('Domain name must be look like "wobbly.me" or "https://wobbly.me"');
      return false;
    }
    return true;
  };
  formatInputs = e => {
    e.preventDefault();
    const { customHost } = this.state;
    if (customHost.indexOf("https://") > -1) {
      this.handleSubmit(customHost.replace("https://", ""));
    } else if (customHost.indexOf("http://") > -1) {
      this.handleSubmit(customHost.replace("http://", ""));
    } else {
      this.handleSubmit(customHost);
    }
  };
  handleChange = e => {
    const { originIntegrations } = this.state;
    let targetValue = e.target.value;
    if (e.target.checked) {
      browser.permissions
        .request({ origins: [`*://*.${targetValue}/*`] })
        .then(res => {
          if (res) {
            originIntegrations.push({
              integration: targetValue,
              host: targetValue
            });
            browser.storage.local.set({
              originIntegrations: originIntegrations
            });
          } else return;
        });
    } else if (!e.target.checked) {
      browser.permissions.remove({ origins: [`*://*.${targetValue}/*`] });
      let filteredArr = originIntegrations.filter(
        item => item.host !== targetValue
      );
      browser.storage.local.set({ originIntegrations: filteredArr });
    }
  };
  checkForActiveIntegration = integration => {
    const { originIntegrations } = this.state;
    if (!originIntegrations) return false;
    return originIntegrations.some(item => item.host === integration);
  };
  enableAllIntegrations = () => {
    let hostArr = [];
    let permissionsArr = [];
    Object.keys(originHosts).forEach(key => {
      hostArr.push({ host: key, integration: key });
      permissionsArr.push(originHosts[key].url);
    });
    browser.permissions.request({ origins: permissionsArr }).then(res => {
      if (res) {
        browser.storage.local.set({ originIntegrations: hostArr });
      } else return;
    });
  };
  disableAllIntegrations = () => {
    const { originIntegrations } = this.state;
    let permissionsArr = [];
    if (originIntegrations.length) {
      originIntegrations.forEach(item => {
        permissionsArr.push(originHosts[item.host].url);
      });
      browser.permissions.remove({ origins: permissionsArr });
      browser.storage.local.set({ originIntegrations: [] });
    }
  };
  render() {
    const {
      customHost,
      integration,
      activeIntegrations,
      notificationInfo
    } = this.state;
    return (
      <>
        <header className="settings-header">
          <div>Settings</div>
        </header>
        <main className="settings-wrapper">
          <section className="settings-integrations">
            <h1>Integrations</h1>
            <ul className="host-list">
              {Object.keys(originHosts).map(key => (
                <li className="origin-host-item" key={key}>
                  <input
                    type="checkbox"
                    id={key}
                    value={key}
                    onChange={this.handleChange}
                    checked={this.checkForActiveIntegration(key)}
                  />
                  <label for={key}>
                    {originHosts[key].name} <span>- {key}</span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="controll-btns-container">
              <button onClick={this.enableAllIntegrations}>Enable all</button>
              <button onClick={this.disableAllIntegrations}>Disable all</button>
            </div>
          </section>
          <section className="settings-integrations">
            <h1>Custom integrations</h1>
            <p>
              If you use a custom domain, enter it in the format "wobbly.me" or
              "https://wobbly.me" and select the integration from the dropdown.{" "}
              <span>Ports are not supported.</span>
            </p>
            <form className="settings-host" onSubmit={this.formatInputs}>
              <input
                id="host-url"
                type="text"
                placeholder="Enter custom domain url"
                value={customHost}
                onChange={e => this.setState({ customHost: e.target.value })}
              />
              <div>
                <select
                  value={integration}
                  onChange={e => this.setState({ integration: e.target.value })}
                >
                  {Object.keys(originHosts).map(integration => (
                    <option value={integration} key={integration}>
                      {originHosts[integration].name}
                    </option>
                  ))}
                </select>
                <input id="submit-btn" type="submit" value="Add" />
              </div>
            </form>
            {activeIntegrations && (
              <ul className="host-list">
                {activeIntegrations.map(item => (
                  <li className="host-item" key={item.host}>
                    <div id={item.host}>
                      {item.host} <span>- {item.integration}</span>
                    </div>
                    <button onClick={this.deleteHostItem}>delete</button>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <SettingsNotifications info={notificationInfo} />
        </main>
      </>
    );
  }
}
export default SettingsPage;
