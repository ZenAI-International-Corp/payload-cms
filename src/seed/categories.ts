import type { Payload } from 'payload'

/**
 * Seed default categories data
 * This function will create all default categories if they don't exist
 */
export async function seedCategories(payload: Payload): Promise<void> {
  try {
    // Check if categories already exist
    const existingCategories = await payload.find({
      collection: 'categories',
      limit: 1,
      depth: 0,
    })

    // If categories already exist, skip seeding
    if (existingCategories.totalDocs > 0) {
      payload.logger.info('Categories already exist, skipping seed')
      return
    }

    payload.logger.info('Seeding default categories...')

    // Main product categories
    const mainCategories = [
      'IP Cameras',
      'NVR',
      'Analog Camera',
      'DVR',
      'Others',
      'IP PVM',
      'Display Control',
      'IP Speaker',
      'Anti-Explosion and Anti-Corrosion Cameras',
    ]

    const createdMainCategories: Record<string, number | string> = {}

    // Create main categories
    for (const categoryName of mainCategories) {
      const slug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      
      const category = await payload.create({
        collection: 'categories',
        data: {
          name: categoryName,
          slug,
          type: 'product-category',
        },
      })

      createdMainCategories[categoryName] = category.id
      payload.logger.info(`Created main category: ${categoryName}`)
    }

    // Get IP Cameras category ID
    const ipCamerasId = createdMainCategories['IP Cameras']

    if (!ipCamerasId) {
      payload.logger.error({ msg: 'IP Cameras category not found' })
      return
    }

    // Ensure ipCamerasId is a number (SQLite uses integer IDs)
    const parentId = typeof ipCamerasId === 'string' ? parseInt(ipCamerasId, 10) : ipCamerasId

    // Create Resolution categories under IP Cameras
    const resolutions = [
      '20MP',
      '1.3MP',
      '2MP',
      '3MP',
      '4MP',
      '5MP',
      '8MP/4K',
      '12MP',
    ]
    for (const resolution of resolutions) {
      const slug = `ip-cameras-resolution-${resolution.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
      
      await payload.create({
        collection: 'categories',
        data: {
          name: resolution,
          slug,
          parent: parentId,
          type: 'resolution',
        },
      })
      payload.logger.info(`Created resolution category: ${resolution}`)
    }

    // Create Series categories under IP Cameras
    const series = [
      'RS Series',
      'Wise-ISP Nightview Tech',
      'EZ Series',
      'EZ Series (Color Low Light)',
      'Prime Series',
      'Prime Series (Color low Light)',
      'Prime Series (Cable Free)',
      'Prime Series (LPR)',
      'Prime Series (Color Hunter)',
      'Pro Series',
      'Omni-View Series',
      'PTZ Camera',
      'AI Series',
      'Classic Series',
    ]
    for (const seriesName of series) {
      const slug = `ip-cameras-series-${seriesName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
      
      await payload.create({
        collection: 'categories',
        data: {
          name: seriesName,
          slug,
          parent: parentId,
          type: 'series',
        },
      })
      payload.logger.info(`Created series category: ${seriesName}`)
    }

    // Create Accessories Type categories under IP Cameras
    const accessoriesTypes = [
      'Wall Mount',
      'Junction Box',
      'Pendant Mount',
      'Pole Mount Adapter',
      'Corner Mount',
      'Plastic Waterproof Joint',
      'Electric-box Transfer Plate',
      'Incline Mount',
      'In-ceiling Mount',
    ]
    for (const accessoryType of accessoriesTypes) {
      const slug = `ip-cameras-accessories-${accessoryType.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
      
      await payload.create({
        collection: 'categories',
        data: {
          name: accessoryType,
          slug,
          parent: parentId,
          type: 'accessories-type',
        },
      })
      payload.logger.info(`Created accessories type category: ${accessoryType}`)
    }

    // Get NVR category ID
    const nvrId = createdMainCategories['NVR']

    if (!nvrId) {
      payload.logger.error({ msg: 'NVR category not found' })
      return
    }

    // Ensure nvrId is a number (SQLite uses integer IDs)
    const nvrParentId = typeof nvrId === 'string' ? parseInt(nvrId, 10) : nvrId

    // Create Series categories under NVR
    const nvrSeries = [
      'Prime IQ Series',
      'EZ Series',
      'Prime Series',
      'Pro Series',
      'MAX HD Series',
    ]
    for (const seriesName of nvrSeries) {
      const slug = `nvr-series-${seriesName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
      
      await payload.create({
        collection: 'categories',
        data: {
          name: seriesName,
          slug,
          parent: nvrParentId,
          type: 'series',
        },
      })
      payload.logger.info(`Created NVR series category: ${seriesName}`)
    }

    // Create Channels categories under NVR
    const channels = [
      '256CH',
      '4CH',
      '8CH',
      '16CH',
      '25CH',
      '32CH',
      '64CH',
      '128CH',
    ]
    for (const channel of channels) {
      const slug = `nvr-channels-${channel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
      
      await payload.create({
        collection: 'categories',
        data: {
          name: channel,
          slug,
          parent: nvrParentId,
          type: 'channels',
        },
      })
      payload.logger.info(`Created NVR channel category: ${channel}`)
    }

    // Get Analog Camera category ID
    const analogCameraId = createdMainCategories['Analog Camera']

    if (!analogCameraId) {
      payload.logger.error({ msg: 'Analog Camera category not found' })
      return
    }

    // Ensure analogCameraId is a number (SQLite uses integer IDs)
    const analogCameraParentId = typeof analogCameraId === 'string' ? parseInt(analogCameraId, 10) : analogCameraId

    // Create Resolution categories under Analog Camera
    const analogCameraResolutions = [
      '1000TVL',
      '2MP',
      '4MP',
      '5MP',
      '700TVL',
      '800TVL',
      '8MP',
    ]
    for (const resolution of analogCameraResolutions) {
      const slug = `analog-camera-resolution-${resolution.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
      
      await payload.create({
        collection: 'categories',
        data: {
          name: resolution,
          slug,
          parent: analogCameraParentId,
          type: 'resolution',
        },
      })
      payload.logger.info(`Created Analog Camera resolution category: ${resolution}`)
    }

    // Get DVR category ID
    const dvrId = createdMainCategories['DVR']

    if (!dvrId) {
      payload.logger.error({ msg: 'DVR category not found' })
      return
    }

    // Ensure dvrId is a number (SQLite uses integer IDs)
    const dvrParentId = typeof dvrId === 'string' ? parseInt(dvrId, 10) : dvrId

    // Create Series categories under DVR
    const dvrSeries = [
      'Hybrid Series',
      'MAXHD Series',
    ]
    for (const seriesName of dvrSeries) {
      const slug = `dvr-series-${seriesName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
      
      await payload.create({
        collection: 'categories',
        data: {
          name: seriesName,
          slug,
          parent: dvrParentId,
          type: 'series',
        },
      })
      payload.logger.info(`Created DVR series category: ${seriesName}`)
    }

    // Create Channels categories under DVR
    const dvrChannels = [
      '4CH',
      '8CH',
      '16CH',
      '32CH',
    ]
    for (const channel of dvrChannels) {
      const slug = `dvr-channels-${channel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
      
      await payload.create({
        collection: 'categories',
        data: {
          name: channel,
          slug,
          parent: dvrParentId,
          type: 'channels',
        },
      })
      payload.logger.info(`Created DVR channel category: ${channel}`)
    }

    // Get Others category ID
    const othersId = createdMainCategories['Others']

    if (!othersId) {
      payload.logger.error({ msg: 'Others category not found' })
      return
    }

    // Ensure othersId is a number (SQLite uses integer IDs)
    const othersParentId = typeof othersId === 'string' ? parseInt(othersId, 10) : othersId

    // Create Resolution categories under Others
    const othersResolutions = [
      '2MP',
      '3MP',
      '4MP',
      '5MP',
    ]
    for (const resolution of othersResolutions) {
      const slug = `others-resolution-${resolution.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
      
      await payload.create({
        collection: 'categories',
        data: {
          name: resolution,
          slug,
          parent: othersParentId,
          type: 'resolution',
        },
      })
      payload.logger.info(`Created Others resolution category: ${resolution}`)
    }

    // Create Series categories under Others
    const othersSeries = ['Prime Series']
    for (const seriesName of othersSeries) {
      const slug = `others-series-${seriesName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
      
      await payload.create({
        collection: 'categories',
        data: {
          name: seriesName,
          slug,
          parent: othersParentId,
          type: 'series',
        },
      })
      payload.logger.info(`Created Others series category: ${seriesName}`)
    }

    // Create Port categories under Others (POE Switch)
    const othersPorts = [
      '6 PORT',
      '10 PORT',
      '16 PORT',
      '24 PORT',
    ]
    for (const port of othersPorts) {
      const slug = `others-port-${port.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
      
      await payload.create({
        collection: 'categories',
        data: {
          name: port,
          slug,
          parent: othersParentId,
          type: 'port',
        },
      })
      payload.logger.info(`Created Others port category: ${port}`)
    }

    // Create Server Series categories under Others (IP Server)
    const othersServerSeries = [
      'Enterprise',
      'Client',
      'Performance',
      'server',
    ]
    for (const serverSeries of othersServerSeries) {
      const slug = `others-server-series-${serverSeries.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
      
      await payload.create({
        collection: 'categories',
        data: {
          name: serverSeries,
          slug,
          parent: othersParentId,
          type: 'server-series',
        },
      })
      payload.logger.info(`Created Others server series category: ${serverSeries}`)
    }

    // Create Capacity categories under Others (UPS)
    const othersCapacities = [
      '1000VA',
      '1500VA',
      '2200VA',
    ]
    for (const capacity of othersCapacities) {
      const slug = `others-capacity-${capacity.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
      
      await payload.create({
        collection: 'categories',
        data: {
          name: capacity,
          slug,
          parent: othersParentId,
          type: 'capacity',
        },
      })
      payload.logger.info(`Created Others capacity category: ${capacity}`)
    }

    // Create Voltage categories under Others (Power Supply)
    const othersVoltages = [
      '4CH-12V',
      '9CH/18CH-12',
      '9CH/18CH-24V',
    ]
    for (const voltage of othersVoltages) {
      const slug = `others-voltage-${voltage.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
      
      await payload.create({
        collection: 'categories',
        data: {
          name: voltage,
          slug,
          parent: othersParentId,
          type: 'voltage',
        },
      })
      payload.logger.info(`Created Others voltage category: ${voltage}`)
    }

    // Create Input Type categories under Others (Monitor)
    const othersInputTypes = [
      'W/O BNC',
      'W/BNC',
    ]
    for (const inputType of othersInputTypes) {
      const slug = `others-input-type-${inputType.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
      
      await payload.create({
        collection: 'categories',
        data: {
          name: inputType,
          slug,
          parent: othersParentId,
          type: 'input-type',
        },
      })
      payload.logger.info(`Created Others input type category: ${inputType}`)
    }

    // Create Size categories under Others (Harddrive)
    const othersSizes = [
      '12TB',
      '1TB',
      '2TB',
      '4TB',
      '6TB',
      '8TB',
      '10TB',
    ]
    for (const size of othersSizes) {
      const slug = `others-size-${size.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
      
      await payload.create({
        collection: 'categories',
        data: {
          name: size,
          slug,
          parent: othersParentId,
          type: 'size',
        },
      })
      payload.logger.info(`Created Others size category: ${size}`)
    }

    // Create Accessories Type categories under Others
    const othersAccessories = ['Connect Box']
    for (const accessory of othersAccessories) {
      const slug = `others-accessories-${accessory.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
      
      await payload.create({
        collection: 'categories',
        data: {
          name: accessory,
          slug,
          parent: othersParentId,
          type: 'accessories-type',
        },
      })
      payload.logger.info(`Created Others accessories type category: ${accessory}`)
    }

    // Get IP PVM category ID
    const ipPvmId = createdMainCategories['IP PVM']

    if (!ipPvmId) {
      payload.logger.error({ msg: 'IP PVM category not found' })
      return
    }

    // Ensure ipPvmId is a number (SQLite uses integer IDs)
    const ipPvmParentId = typeof ipPvmId === 'string' ? parseInt(ipPvmId, 10) : ipPvmId

    // Create Size categories under IP PVM (Screen Size)
    const ipPvmSizes = [
      '24 inch',
      '27 inch',
      '32 inch',
    ]
    for (const size of ipPvmSizes) {
      const slug = `ip-pvm-size-${size.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
      
      await payload.create({
        collection: 'categories',
        data: {
          name: size,
          slug,
          parent: ipPvmParentId,
          type: 'size',
        },
      })
      payload.logger.info(`Created IP PVM size category: ${size}`)
    }

    // Get Display Control category ID
    const displayControlId = createdMainCategories['Display Control']

    if (!displayControlId) {
      payload.logger.error({ msg: 'Display Control category not found' })
      return
    }

    // Ensure displayControlId is a number (SQLite uses integer IDs)
    const displayControlParentId = typeof displayControlId === 'string' ? parseInt(displayControlId, 10) : displayControlId

    // Create Resolution categories under Display Control
    const displayControlResolutions = ['5MP']
    for (const resolution of displayControlResolutions) {
      const slug = `display-control-resolution-${resolution.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
      
      await payload.create({
        collection: 'categories',
        data: {
          name: resolution,
          slug,
          parent: displayControlParentId,
          type: 'resolution',
        },
      })
      payload.logger.info(`Created Display Control resolution category: ${resolution}`)
    }

    // Create Series categories under Display Control
    const displayControlSeries = ['Prime Series']
    for (const seriesName of displayControlSeries) {
      const slug = `display-control-series-${seriesName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
      
      await payload.create({
        collection: 'categories',
        data: {
          name: seriesName,
          slug,
          parent: displayControlParentId,
          type: 'series',
        },
      })
      payload.logger.info(`Created Display Control series category: ${seriesName}`)
    }

    // Create Size categories under Display Control (Screen Size)
    const displayControlSizes = [
      '19 inch',
      '24 inch',
      '27 inch',
    ]
    for (const size of displayControlSizes) {
      const slug = `display-control-size-${size.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
      
      await payload.create({
        collection: 'categories',
        data: {
          name: size,
          slug,
          parent: displayControlParentId,
          type: 'size',
        },
      })
      payload.logger.info(`Created Display Control size category: ${size}`)
    }

    // Get IP Speaker category ID
    const ipSpeakerId = createdMainCategories['IP Speaker']

    if (!ipSpeakerId) {
      payload.logger.error({ msg: 'IP Speaker category not found' })
      return
    }

    // Ensure ipSpeakerId is a number (SQLite uses integer IDs)
    const ipSpeakerParentId = typeof ipSpeakerId === 'string' ? parseInt(ipSpeakerId, 10) : ipSpeakerId

    // Create Port categories under IP Speaker (POE Switch)
    const ipSpeakerPorts = ['6 PORT']
    for (const port of ipSpeakerPorts) {
      const slug = `ip-speaker-port-${port.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
      
      await payload.create({
        collection: 'categories',
        data: {
          name: port,
          slug,
          parent: ipSpeakerParentId,
          type: 'port',
        },
      })
      payload.logger.info(`Created IP Speaker port category: ${port}`)
    }

    payload.logger.info('Default categories seeded successfully!')
  } catch (error) {
    payload.logger.error({ msg: 'Error seeding categories', err: error })
    throw error
  }
}

