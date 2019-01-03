import { generateName } from './creeps/utils.js'
import { requestSpawn } from './creeps/spawning.js'

export function init() {
  let count = 0

  for (const creepName in Game.creeps) {
    const creep = Game.creeps[creepName]

    if (creep.memory.role === 'Builder') {
      count++
      runBuilder(creep)
    }
  }

  if (count < 3) {
    requestSpawn([MOVE, MOVE, CARRY, WORK], generateName(), {
      memory: {
        role: 'Builder',
        status: 'fill' // 'spend'
      }
    })
  }
}

function runBuilder(creep) {
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
    const target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
    if(target) {
      if (creep.build(target) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target)
      }
    }
  }
}
