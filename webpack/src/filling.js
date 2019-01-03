import { generateName } from './creeps/utils.js'
import { requestSpawn } from './creeps/spawning.js'

export function init() {
  let count = 0

  for (const creepName in Game.creeps) {
    const creep = Game.creeps[creepName]

    if (creep.memory.role === 'Filler') {
      count++
      runFiller(creep)
    }
  }

  if (count < 1) {
    requestSpawn([MOVE, MOVE, CARRY, WORK], generateName(), {
      memory: {
        role: 'Filler',
        status: 'fill' // 'spend'
      }
    })
  }
}

function runFiller(creep) {
  if (creep.carry[RESOURCE_ENERGY] === creep.carryCapacity) {
    creep.memory.status = 'spend'
  } else if (creep.carry[RESOURCE_ENERGY] === 0) {
    creep.memory.status = 'fill'
  }

  if (creep.memory.status === 'fill') {
    // replace with storage
    const droppedRessources = creep.room.find(FIND_MY_STRUCTURES, {
      filter: { structureType: STRUCTURE_SPAWN }
    })[0].pos.findInRange(FIND_DROPPED_RESOURCES, 3)

    if (droppedRessources.length) {
      if (creep.pickup(droppedRessources[0]) === ERR_NOT_IN_RANGE) {
        creep.moveTo(droppedRessources[0])
      } else {
        creep.moveTo(creep.room.controller)
      }
    }
  } else {
    const spawns = creep.room.find(FIND_MY_STRUCTURES, {
        filter: { structureType: STRUCTURE_SPAWN }
    })
    const extensions = creep.room.find(FIND_MY_STRUCTURES, {
        filter: { structureType: STRUCTURE_EXTENSION }
    })

    let target = null

    for (let spawn of spawns) {
      if (spawn.energy < spawn.energyCapacity) {
        target = spawn
        break
      }
    }

    if (!target) {
      for (let extension of extensions) {
        if (extension.energy < extension.energyCapacity) {
          target = extension
          break
        }
      }
    }

    if (target) {
      if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target)
      }
    }
  }
}
