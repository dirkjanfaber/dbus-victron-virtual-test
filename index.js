const dbus = require('dbus-native');
const { addVictronInterfaces } = require('dbus-victron-virtual');

// example adopted from https://github.com/sidorares/dbus-native/blob/master/examples/basic-service.js
const serviceName = 'com.victronenergy.heatpump.virtual_dfa';
const interfaceName = serviceName;
const objectPath = '/';

const sessionBus = dbus.sessionBus();
if (!sessionBus) {
  throw new Error('Could not connect to the DBus session bus.');
}

sessionBus.requestName(serviceName, 0x4, (err, retCode) => {
  // If there was an error, warn user and fail
  if (err) {
    throw new Error(
      `Could not request service name ${serviceName}, the error was: ${err}.`
    );
  }

  // Return code 0x1 means we successfully had the name
  if (retCode === 1) {
    console.log(`Successfully requested service name "${serviceName}"!`);
    proceed();
  } else {
    /* Other return codes means various errors, check here
	(https://dbus.freedesktop.org/doc/api/html/group__DBusShared.html#ga37a9bc7c6eb11d212bf8d5e5ff3b50f9) for more
	information
	*/
    throw new Error(
      `Failed to request service name "${serviceName}". Check what return code "${retCode}" means.`
    );
  }
});

async function proceed() {
  // First, we need to create our interface description (here we will only expose method calls)
  var ifaceDesc = {
    name: interfaceName,
    methods: {
    },
    properties: {
      Connected: 'i',
      ProductName: 's',
      ProductId: {
        type: 'i',
        format: (v) => 'C029'
      },
      'Temperature/OutdoorHeatExchanger': {
        type: 'd',
        format: (v) => v.toFixed(1)+'C'
      },
      'Temperature/IndoorAmbient': {
        type: 'd',
        format: (v) => v.toFixed(1)+'C'
      },
      Status: 'd',
      DeviceInstance: {
        type: 'i',
        format: (v) => v.toString()
      },
      HumanPresence: 'i',
      EnergyConsumption: 'i',
      FanSpeed: 'i',
      OperationalMode: {
        type: 'i',
        format: (v) => ({
          0: 'auto',
          1: 'cool',
          2: 'heat',
          3: 'dry',
          4: 'fan',
          5: 'off'
        }[v] || 'unknown')
      },
      ErrorCode: 'i',
      CustomName: 's',
      BatteryVoltage: 'd',
      'Alarms/LowBattery': 'd',
    },
    signals: {
    }
  };

  // Then we need to create the interface implementation (with actual functions)
  var iface = {
    Connected: 1,
    'Temperature/OutdoorHeatExchanger': 0,
    'Temperature/IndoorAmbient': 0,
    HumanPresence: 0,
    EnergyConsumption: 0,
    FanSpeed: 0,
    ErrorCode: 0,
    OperationalMode: 0,
    Status: 0,
    DeviceInstance: 33,
    CustomName: '',
    BatteryVoltage: 3.3,
    'Alarms/LowBattery': 0,
    emit: function() {
      // no nothing, as usual
    }
  };

  // Now we need to actually export our interface on our object
  sessionBus.exportInterface(iface, objectPath, ifaceDesc);

  // Then we can add the required Victron interfaces, and receive some funtions to use
  const {
    emitItemsChanged,
    addSettings,
    removeSettings,
    getValue,
    setValue
  } = addVictronInterfaces(sessionBus, ifaceDesc, iface);

  console.log('Interface exposed to DBus, ready to receive function calls!');
}
