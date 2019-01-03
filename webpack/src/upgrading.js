import { generateName } from './creeps/utils.js'
import { requestSpawn } from './creeps/spawning.js'

export function init() {
  let count = 0

  for (const creepName in Game.creeps) {
    const creep = Game.creeps[creepName]

    if (creep.memory.role === 'Upgrader') {
      count++
      runUpgrader(creep)
    }
  }

  if (count < 7) {
    requestSpawn([MOVE, MOVE, CARRY, WORK], generateName(), {
      memory: {
        role: 'Upgrader',
        status: 'fill' // 'spend'
      }
    })
  }
}

function runUpgrader(creep) {
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
    const err = creep.upgradeController(creep.room.controller)
    creep.moveTo(creep.room.controller)
    if (err === ERR_NOT_IN_RANGE) {
    }
  }
}
