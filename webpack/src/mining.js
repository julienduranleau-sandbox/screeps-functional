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

function serializePath(path) {
  return path.map(pos => `${pos.roomName}:${pos.x},${pos.y}`).join('|')
}

function deserializePath(serializePath) {
  return serializePath.split('|').map(str => {
    let parts = str.match(/([A-Z0-9]+):([0-9]+),([0-9]+)/)
    return new RoomPosition(+parts[2], +parts[3], parts[1])
  })
}

function getGatheringPath(from, to) {
  return serializePath(PathFinder.search(from.pos, { pos: to.pos, range: 1 }).path)
}

function updateGatheringChain(chainId, from, to, nChainLinks) {
  if (!Memory.gatherChains) {
    Memory.gatherChains = {}
  }
  if (!Memory.gatherChains[chainId]) {
    Memory.gatherChains[chainId] = {
      creeps: [],
      path: getGatheringPath(from, to)
    }
  }

  let requireChainUpdate = false

  // remove dead creeps
  for (let i = Memory.gatherChains[chainId].creeps.length - 1; i >= 0; i--) {
    const creepId = Memory.gatherChains[chainId].creeps[i]

    if (!Game.getObjectById(creepId)) {
      Memory.gatherChains[chainId].creeps.splice(i, 1)
      requireChainUpdate = true
    }
  }

  // add newly spawned creeps
  for (const creepName in Game.creeps) {
    const creep = Game.creeps[creepName]

    if (creep.memory.role === 'ChainLink' && creep.memory.chain.id === chainId && !creep.memory.chain.added) {
      Memory.gatherChains[chainId].creeps.push(creep.id)
      creep.memory.chain.added = true
      requireChainUpdate = true
    }
  }

  // spawn new creeps
  if (Memory.gatherChains[chainId].creeps.length < nChainLinks) {
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

function applyChain(from, to, chain) {
  console.log('APPLY CHAIN')
  const path = deserializePath(chain.path)
  const nChunks = ceil(path.length / chain.creeps.length)
  const pathChunks = _.chunk(deserializePath(chain.path), nChunks)

  for (let i = 0; i < chain.creeps.length; i++) {
    const creep = Game.getObjectById(chain.creeps[i])

    creep.memory.chain.pathTo = serializePath(pathChunks[i])
    creep.memory.chain.pathFrom = serializePath(pathChunks[i].reverse())
    creep.memory.chain.onPath = false

    if (i === 0) creep.memory.chain.first = true
    else delete creep.memory.chain.first

    if (i === chain.creeps.length - 1) creep.memory.chain.last = true
    else delete creep.memory.chain.last
  }
}

function runGatheringChain(chainId) {
  const creepsIdsInChain = Memory.gatherChains[chainId].creeps

  for (let creepId of creepsIdsInChain) {
    const creep = Game.getObjectById(creepId)

    if (creep.memory.chain.onPath === false) {
      getCreepOnGatheringPath(creep)
    } else {
      if (creep.carry[RESOURCE_ENERGY] < creep.carryCapacity) {
        getResourceFromPrevInChain(creep)
      } else {
        sendResourceToNextInChain(creep)
      }
    }
  }
}

function getCreepOnGatheringPath(creep) {
  const pathFrom = deserializePath(creep.memory.chain.pathFrom)
  creep.moveTo(pathFrom[0])

  if (creep.pos.isEqualTo(pathFrom[0])) {
    creep.memory.chain.onPath = true
  }
}

function getResourceFromPrevInChain(creep) {
  const pathFrom = deserializePath(creep.memory.chain.pathFrom)

  creep.moveByPath(pathFrom)
  
  // TODO: Only check at end of path? Careful, breaks if simple pos === last
  if (creep.memory.chain.first) {
    const droppedRessources = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1)
    if (droppedRessources.length) {
      let status = creep.pickup(droppedRessources[0])
    }
  }
}

function sendResourceToNextInChain(creep) {
  const pathTo = deserializePath(creep.memory.chain.pathTo)

  let status = creep.moveByPath(pathTo)
  if (creep.pos.isEqualTo(_.last(pathTo))) {
    if (creep.memory.chain.last) {
      if (creep.pos.isEqualTo(_.last(pathTo))) {
        creep.drop(RESOURCE_ENERGY)
      }
      // const err = creep.transfer(to, RESOURCE_ENERGY)
      // if (err === ERR_NOT_IN_RANGE) {
      //   creep.moveTo(to)
      // }
      // if (err === ERR_FULL) {
      //   // replace with storage
      // }
    } else {
      let transferTarget = creep.pos.findInRange(FIND_MY_CREEPS, 1, {
        filter: function(otherCreep) {
          return otherCreep.id !== creep.id && otherCreep.memory.role === "ChainLink" && otherCreep.memory.chain.id === creep.memory.chain.id
        }
      })

      if (transferTarget.length) {
        creep.transfer(transferTarget[0], RESOURCE_ENERGY)
      }
    }
  }
}
