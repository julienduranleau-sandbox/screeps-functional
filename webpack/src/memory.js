export function clearDeadCreeps(debug = false) {
  for(var name in Memory.creeps) {
    if (!Game.creeps[name]) {
      if (debug) console.log('Clearing non-existing creep memory: ', name)
      delete Memory.creeps[name]
    }
  }
}
