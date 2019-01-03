import './global/math.js'
import * as Mining from './mining.js'
import * as Upgrading from './upgrading.js'
import * as MemoryUtils from './memory.js'

MemoryUtils.clearDeadCreeps(true)
Mining.init()
Upgrading.init()
