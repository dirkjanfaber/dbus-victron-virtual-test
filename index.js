const dbus = require('dbus-native');
const { addVictronInterfaces } = require('dbus-victron-virtual');

// example adopted from https://github.com/sidorares/dbus-native/blob/master/examples/basic-service.js
const serviceName = 'com.victronenergy.my_service1';
const interfaceName = serviceName;
const objectPath = `/${serviceName.replace(/\./g, '/')}`;

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
      // Simple types
      SayHello: ['', 's', [], ['hello_sentence']],
      GiveTime: ['', 's', [], ['current_time']],
      Capitalize: ['s', 's', ['initial_string'], ['capitalized_string']]
    },
    properties: {
      Flag: 'b',
      StringProp: 's',
      RandValue: 'i'
    },
    signals: {
      Rand: ['i', 'random_number']
    }
  };

  // Then we need to create the interface implementation (with actual functions)
  var iface = {
    SayHello: function() {
      return 'Hello, world!';
    },
    GiveTime: function() {
      return new Date().toString();
    },
    Capitalize: function(str) {
      return str.toUpperCase();
    },
    Flag: true,
    StringProp: 'initial string',
    RandValue: 43,
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

  const settingsResult = await addSettings([
    { path: '/Settings/Basic2/OptionA', default: 3, min: 0, max: 5 },
    { path: '/Settings/Basic2/OptionB', default: 'x' },
    { path: '/Settings/Basic2/OptionC', default: 'y' },
    { path: '/Settings/Basic2/OptionD', default: 'y' },
  ]);
  console.log('settingsResult', JSON.stringify(settingsResult, null, 2));

  const removeSettingsResult = await removeSettings([
    { path: '/Settings/Basic2/OptionC' },
    { path: '/Settings/Basic2/OptionD' }
  ]);
  console.log('removeSettingsResult', JSON.stringify(removeSettingsResult, null, 2));

  setInterval(async () => {

    // emit a random value (not relevant for our Victron interfaces)
    var rand = Math.round(Math.random() * 100);
    if (rand > 75) {
      iface.emit('Rand', Math.round(Math.random() * 100));
    }

    // set a random value. By calling emitItemsChanged afterwards, the
    // Victron-specific signal 'ItemsChanged' will be emitted
    iface.RandValue = Math.round(Math.random() * 100);
    emitItemsChanged();

    // change a setting programmatically
    const setValueResult = await setValue({
      path: '/Settings/Basic2/OptionB',
      value: 'changed via SetValue ' + Math.round(Math.random() * 100),
      interface: 'com.victronenergy.BusItem',
      destination: 'com.victronenergy.settings'
    });
    console.log('setValueResult', setValueResult);

    // or get a configuration value
    const getValueReult = await getValue({
      path: '/Settings/Basic2/OptionB',
      interface: 'com.victronenergy.BusItem',
      destination: 'com.victronenergy.settings'
    });
    console.log('getValueResult', JSON.stringify(getValueReult, null, 2));

  }, 1000);

}
