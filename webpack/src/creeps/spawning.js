let spawnRequested = false

export function requestSpawn(parts, name, data) {
  if (!spawnRequested) {
    Game.spawns['Home'].spawnCreep(parts, name, data)
    spawnRequested = true
  }
}
