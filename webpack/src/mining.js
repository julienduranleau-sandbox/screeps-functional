import { generateName } from './creeps/utils.js'
import { requestSpawn } from './creeps/spawning.js'

export function init() {
  for (const flagName in Game.flags) {

    // G-Spawn-RessourceName-nChainLinks
    // ex: G-Home-Mineral1-2
    if (/G-.*-.*-[0-9]+/.test(flagName)) {
      const flag = Game.flags[flagName]
      const flagNameParts = flagName.split('-')
      const spawnName = flagNameParts[1]
      const ressourceName = flagNameParts[2]
      const nChainLinks = +flagNameParts[3]
      const chainId = spawnName + '-' + ressourceName

      const flagTarget = flag.room.lookForAt(LOOK_SOURCES, flag)[0]

      gatherFromSource(flagTarget)

      updateGatheringChain(chainId, flagTarget, Game.spawns[spawnName], nChainLinks)
      runGatheringChain(chainId)
    }
  }
}

function gatherFromSource(source) {
  let gatherer = null

  for (const creepName in Game.creeps) {
    const creep = Game.creeps[creepName]

    if (creep.memory.role === 'Miner' && creep.memory.targetId === source.id) {
      gatherer = creep
      break
    }
  }

  if (gatherer) {
    gatherer.moveTo(source)
    gatherer.harvest(source)
  } else {
    requestSpawn([MOVE, WORK, WORK], generateName(), {
      memory: {
        role: 'Miner',
        targetId: source.id
      }
    })
  }
}

function updateGatheringChain(chainId, from, to, nChainLinks) {
  if (!Memory.gatherChains) Memory.gatherChains = {}
  if (!Memory.gatherChains[chainId]) Memory.gatherChains[chainId] = []

  let requireChainUpdate = false

  // remove dead creeps
  for (let i = Memory.gatherChains[chainId].length - 1; i >= 0; i--) {
    const creepId = Memory.gatherChains[chainId][i]

    if (!Game.getObjectById(creepId)) {
      Memory.gatherChains[chainId].splice(i, 1)
      requireChainUpdate = true
    }
  }

  // add newly spawned creeps
  for (const creepName in Game.creeps) {
    const creep = Game.creeps[creepName]

    if (creep.memory.role === 'ChainLink' && creep.memory.chain.id === chainId && !creep.memory.chain.added) {
      Memory.gatherChains[chainId].push(creep.id)
      creep.memory.chain.added = true
      requireChainUpdate = true
    }
  }

  // spawn new creeps
  if (Memory.gatherChains[chainId].length < nChainLinks) {
    requestSpawn([CARRY, MOVE], generateName(), {
      memory: {
        role: 'ChainLink',
        chain: {
          id: chainId,
          added: false,
          from: null,
          to: null,
        }
      }
    })
  }

  if (requireChainUpdate) {
    applyChain(from, to, Memory.gatherChains[chainId])
  }
}

function applyChain(from, to, creepIds) {
  for (let i = 0; i < creepIds.length; i++) {
    const creep = Game.getObjectById(creepIds[i])

    if (i === 0) {
        creep.memory.chain.from = from.id
        creep.memory.chain.first = true
    } else {
        creep.memory.chain.from = creepIds[i - 1]
        delete creep.memory.chain.first
    }

    if (i === creepIds.length - 1) {
        creep.memory.chain.to = to.id
        creep.memory.chain.last = true
    } else {
        creep.memory.chain.to = creepIds[i + 1]
        delete creep.memory.chain.last
    }
  }
}

function runGatheringChain(chainId) {
  const creepsIdsInChain = Memory.gatherChains[chainId]

  for (let creepId of creepsIdsInChain) {
    const creep = Game.getObjectById(creepId)

    if (creep.carry[RESOURCE_ENERGY] < creep.carryCapacity) {
      getResourceFromPrevInChain(creep)
    } else {
      sendResourceToNextInChain(creep)
    }
  }
}

function getResourceFromPrevInChain(creep) {
  const to = Game.getObjectById(creep.memory.chain.to)
  const from = Game.getObjectById(creep.memory.chain.from)

  if (creep.memory.chain.first) {
    const droppedRessources = from.pos.findInRange(FIND_DROPPED_RESOURCES, 2)
    if (droppedRessources.length) {
      if (creep.pickup(droppedRessources[0]) === ERR_NOT_IN_RANGE) {
        creep.moveTo(droppedRessources[0])
      } else {
        creep.moveTo(from)
      }
    }
  } else {
    creep.moveTo(from)
  }
}

function sendResourceToNextInChain(creep) {
  const to = Game.getObjectById(creep.memory.chain.to)
  const from = Game.getObjectById(creep.memory.chain.from)

  if (creep.memory.chain.last) {
    const err = creep.transfer(to, RESOURCE_ENERGY)
    if (err === ERR_NOT_IN_RANGE) {
      creep.moveTo(to)
    }
    if (err === ERR_FULL) {
      // replace with storage
      creep.drop(RESOURCE_ENERGY)
    }
  } else {
    if (creep.transfer(to, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.moveTo(to)
    } else {
      creep.moveTo(from)
    }
  }
}
