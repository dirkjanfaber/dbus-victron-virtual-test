
# Manually Test `dbus-victron-virtual`

[dbus-victron-virtual](https://github.com/Chris927/dbus-victron-virtual) is an
NPM package in active development. This package (dbus-victron-virtual-test)
serves as a manual test of this package.


## Instructions

### Prerequisites

1. Have a device with [Venus OS Large
   image](https://www.victronenergy.com/live/venus-os:large) available.
2. Have the device set up for local development (e.g. `git` available). (TODO:
   What does this all entail?)


### Installation

Clone this repo:

```bash
git clone https://github.com/Chris927/dbus-victron-virtual-test.git
```

Install npm dependencies:

```bash
npm install
```

Run it:

```bash
DBUS_SESSION_BUS_ADDRESS=unix:socket=/var/run/dbus/system_bus_socket node index.js
```

Then you can run e.g. `dbus-spy` to see your interface. Read ./index.js to
understand what this test is doing.

There are portions of ./indes.js commented out, e.g. to set or read settings.
You can experiment by (un)commenting those.

