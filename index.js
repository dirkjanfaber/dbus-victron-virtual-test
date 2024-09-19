const dbus = require('dbus-native');
const { addVictronInterfaces } = require('dbus-victron-virtual');

const sessionBus = dbus.sessionBus();
if (!sessionBus) {
  throw new Error('Could not connect to the DBus session bus.');
}

proceed();

async function proceed() {

  const {
    emitItemsChanged,
    addSettings,
    removeSettings,
    getValue,
    setValue
  } = addVictronInterfaces(sessionBus, { name: 'com.victronenergy.settings' }, {});

  const settingsResult = await addSettings([
          { path: '/Settings/Relay/2/InitialState', default: 0, min: 0, max: 1 },
          { path: '/Settings/Relay/2/Function', default: 0, min: 0, max: 3 },
          { path: '/Settings/Relay/2/Polarity', default: 0, min: 0, max: 1 },
  ]);

}
