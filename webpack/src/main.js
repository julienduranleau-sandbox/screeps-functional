import './global/math.js'
import * as Mining from './mining.js'
import * as Upgrading from './upgrading.js'
import * as Filling from './filling.js'
import * as Building from './building.js'
import * as MemoryUtils from './memory.js'

MemoryUtils.clearDeadCreeps(true)

Filling.init()
Mining.init()
Building.init()
Upgrading.init()
