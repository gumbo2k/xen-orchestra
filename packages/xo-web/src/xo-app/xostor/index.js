import _ from 'intl'

import decorate from 'apply-decorators'
import React from 'react'
import { connectStore } from 'utils'
import { Container, Col, Row } from 'grid'
import { injectState, provideState } from 'reaclette'
import { Input as DebounceInput } from 'debounce-input-decorator'

import Page from '../page'
import { SelectHost, SelectPool } from '../../common/select-objects'
import { createGetObjectsOfType } from '../../common/selectors'
import { toggleState, linkState } from '../../common/reaclette-utils'
import { Host, Pool } from '../../common/render-xo-item'
import ActionButton from '../../common/action-button'
import Icon from 'icon'
import Collapse from '../../common/collapse'
import { hostMultipathingPaths, pool } from '../../common/intl/messages'
import Select from '../../common/form/select'
import { find, first, includes, map, remove, size } from 'lodash'
import { getBlockDevicesByHost } from 'xo'
import { formatSize } from '../../common/utils'
import { Card, CardBlock, CardHeader } from 'card'
import { Number } from 'form'

const N_HOSTS_MIN = 3
const N_HOSTS_MAX = 7

// ===================================================================

const alreadyHasXostore = () => false // @TODO: Check is xostore already exist in the pool. See with Ronan if the limitation is still required

const isGoodNumberOfHosts = hosts => size(hosts) >= N_HOSTS_MIN && size(hosts) <= N_HOSTS_MAX

const isXcpngPool = host => host.productBrand === 'XCP-ng'

const xostoreDiskPredicate = disk => disk.type === 'disk' && disk.ro === '0' && disk.mountpoint === '' // @TODO: Accpect disk.type 'raid[...]'

const formatDiskName = name => '/dev/' + name

// ===================================================================

const HEADER = (
  <Container>
    <h2>
      {/* @TODO: Add xostor icon */}
      {_('xostor')}
    </h2>
  </Container>
)
export default decorate([
  connectStore(() => {
    return {
      hostsByPoolId: createGetObjectsOfType('host').sort().groupBy('$pool'),
    }
  }),
  provideState({
    initialState: () => ({
      onlyShowXostorePools: false, // @TODO: Default to true
      poolId: undefined,
      hostsPool: [],
      srName: '',
      srDescription: '',
    }),
    effects: {
      toggleState,
      linkState,
      onChange: function (_, pool) {
        return { poolId: pool.id, hostsPool: this.props.hostsByPoolId[pool.id] }
      },
    },
    computed: {
      // Form ====================================================================
      isFormInvalid: state => state.isPoolCompatibleXostore,
      xostorePoolPredicate: (state, props) => pool => {
        if (!state.onlyShowXostorePools) {
          return true
        }

        const hostsPool = props.hostsByPoolId[pool.id]
        return isGoodNumberOfHosts(hostsPool) && isXcpngPool(first(hostsPool)) && !alreadyHasXostore()
      },

      // Selected Pool ===========================================================
      isXcpngPool: state => isXcpngPool(first(state.hostsPool)),
      isPoolGoodNumberOfHosts: state => isGoodNumberOfHosts(state.hostsPool),
      poolAlreadyHasXostore: () => alreadyHasXostore(),
      isPoolCompatibleXostore: state =>
        state.isPoolGoodNumberOfHosts && state.isXcpngPool && !state.poolAlreadyHasXostore,

      // Hosts Pool ==============================================================
      hostsIsMissingPackages: () => true, // @TODO: Check if at least one host need to install packages
    },
  }),
  injectState,
  ({ effects, state }) => {
    return (
      <Page header={HEADER}>
        <Container>
          {/* SR */}
          <Row className='mb-1'>
            <Col size={6}>
              {_('name')}
              <DebounceInput className='form-control' onChange={effects.linkState} name='srName' value={state.srName} />
            </Col>
            <Col size={6}>
              {_('description')}
              <DebounceInput
                className='form-control'
                onChange={effects.linkState}
                name='srDescription'
                value={state.srDescription}
              />
            </Col>
          </Row>
          {/* Pool Selector */}
          <div className='mb-1'>
            <label>
              <input
                type='checkbox'
                checked={state.onlyShowXostorePools}
                onChange={effects.toggleState}
                name='onlyShowXostorePools'
              />{' '}
              Only show pools that meet XOSTOR requirements
            </label>
            <SelectPool predicate={state.xostorePoolPredicate} value={state.poolId} onChange={effects.onChange} />
            {state.poolId !== undefined && !state.isPoolCompatibleXostore && (
              <div className='text-danger'>
                {/* @TODO: add href */}
                <p className='mb-0'>
                  <Pool id={state.poolId} link /> does not meet the requirements for XOSTOR. Refer to the{' '}
                  <a href='#'>documentation</a>
                </p>
                <ul>
                  {!state.isXcpngPool && <li>Not an XCP-ng pool</li>}
                  {!state.isPoolGoodNumberOfHosts && <li>Wrong number of hosts</li>}
                  {state.poolAlreadyHasXostore && <li>Already have a XOSTOR storage</li>}
                </ul>
              </div>
            )}
          </div>
          {/* Install packages */}
          <div className='mb-1'>
            <em>
              <Icon icon='info' /> On each hosts, "xcp-ng-release-linstor" and "xcp-ng-linstor" will be installed. You
              also can install them manually
            </em>
            <br />
            <ActionButton
              btnStyle='primary'
              disabled={!state.isPoolCompatibleXostore || !state.hostsIsMissingPackages}
              tooltip={
                !state.isPoolCompatibleXostore
                  ? 'Invalid pool'
                  : !state.hostsIsMissingPackages
                  ? 'Hosts already have packages'
                  : undefined
              }
              icon='menu-xosan'
            >
              Install packages
            </ActionButton>
          </div>
          <DisksSection hosts={state.hostsPool} poolId={state.poolId} />
          <SettingsSection />
        </Container>
      </Page>
    )
  },
])

const DisksSection = decorate([
  provideState({
    initialState: () => ({
      onlyShowXostorDisks: true,
      disksByHost: {},
      selectedHostId: undefined,
    }),
    effects: {
      handleHostChange: function (_, host) {
        this.state.selectedHostId = host.id
      },
      handleDiskChange: function (_, disk) {
        return state => {
          const disksOfTheHost = state.disksByHost[state.selectedHostId] ?? []
          disksOfTheHost.push(disk)
          return {
            disksByHost: {
              ...state.disksByHost,
              [state.selectedHostId]: disksOfTheHost,
            },
          }
        }
      },
      removeDisk: function (_, disk) {
        return state => {
          const disksOfTheHost = state.disksByHost[state.selectedHostId] ?? []
          remove(disksOfTheHost, _disk => _disk.name === disk.name)
          return {
            disksByHost: {
              ...state.disksByHost,
              [state.selectedHostId]: disksOfTheHost,
            },
          }
        }
      },
      toggleState,
    },
    computed: {
      hostPredicate: function ({ poolId }) {
        return host => host.$pool === poolId
      },
      blockdevices: async function ({ selectedHostId }) {
        if (selectedHostId === undefined) {
          return
        }
        return (await getBlockDevicesByHost(selectedHostId)).blockdevices
      },
      disks: async function ({ blockdevices, onlyShowXostorDisks }) {
        return onlyShowXostorDisks ? blockdevices?.filter(xostoreDiskPredicate) : blockdevices
      },
      unselectedDisks: function ({ disks, disksByHost, selectedHostId }) {
        return disks
          ?.filter(disk => !disksByHost[selectedHostId]?.some(_disk => _disk.name === disk.name))
          .sort((a, b) => Number(b.size) - Number(a.size))
      },
    },
  }),
  injectState,
  ({ effects, state }) => {
    return (
      <div>
        <h3>Disks</h3>
        <div style={{ border: '2px solid black', padding: '10px' }}>
          <Row>
            <Col size={8}>
              <Row>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                  }}
                >
                  <Col size={6}>
                    <div>
                      <SelectHost
                        className='align-bottom'
                        onChange={effects.handleHostChange}
                        value={state.selectedHostId}
                        predicate={state.hostPredicate}
                      />
                    </div>
                  </Col>
                  <Col size={6}>
                    <label>
                      <input
                        type='checkbox'
                        checked={state.onlyShowXostorDisks}
                        onChange={effects.toggleState}
                        name='onlyShowXostorDisks'
                      />{' '}
                      Only show disks that meet XOSTOR requirements
                    </label>
                    <Select
                      placeholder='Select disk(s) ...'
                      value={null}
                      options={state.selectedHostId === undefined ? [] : state.unselectedDisks}
                      optionRenderer={disk => (
                        <span>
                          <Icon icon='disk' /> {formatDiskName(disk.name)} {formatSize(Number(disk.size))}
                        </span>
                      )}
                      onChange={effects.handleDiskChange}
                    />
                  </Col>
                </div>
              </Row>
              <Row>
                {state.disksByHost[state.selectedHostId] !== undefined && (
                  <Col className='mt-1'>
                    <ul className='list-group'>
                      {state.disksByHost[state.selectedHostId]?.map(disk => {
                        const diskGoodType = disk.type === 'disk'
                        const diskRo = disk.ro === '1'
                        const diskMounted = disk.mountpoint !== ''
                        const isDiskValid = diskGoodType && !diskRo && !diskMounted
                        return (
                          <li key={disk.name} className='list-group-item'>
                            <Icon icon='disk' /> {formatDiskName(disk.name)} {formatSize(Number(disk.size))}
                            <ActionButton
                              icon='delete'
                              size='small'
                              btnStyle='danger'
                              className='pull-right'
                              handler={effects.removeDisk}
                              handlerParam={disk}
                            />
                            {!isDiskValid && (
                              <div className='text-danger'>
                                <Icon icon='error' /> Disk incompatible with XOSTOR
                                <ul>
                                  {!diskGoodType && (
                                    <li>Only disk type: "Disk" and "Raid" are accpected. Selected disk: {disk.type}</li>
                                  )}
                                  {diskRo && <li>Disk is read only</li>}
                                  {diskMounted && <li>Disk have a mountpoint</li>}
                                </ul>
                              </div>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </Col>
                )}
              </Row>
            </Col>
            <Col size={4}>
              {map(state.hostsPool, host => (
                <HostDropdown key={host.id} host={host} disks={state.disksByHost[host.id]} className='mb-1' />
              ))}
            </Col>
          </Row>
        </div>
      </div>
    )
  },
])

const HostDropdown = ({ host, disks }) => {
  return (
    <Collapse buttonText={`(${disks?.length ?? 0}) ${host.hostname}`} className='mb-1' size='medium'>
      <ul
        style={{
          padding: 0,
        }}
      >
        {disks?.map(disk => {
          const diskGoodType = disk.type === 'disk'
          const diskRo = disk.ro === '1'
          const diskMounted = disk.mountpoint !== ''
          const isDiskValid = diskGoodType && !diskRo && !diskMounted
          return (
            <li key={disk.name} className='list-group-item'>
              <Icon icon='disk' /> {formatDiskName(disk.name)} {formatSize(Number(disk.size))}
              {!isDiskValid && (
                <div className='text-danger'>
                  <Icon icon='error' /> Disk incompatible with XOSTOR
                  <ul>
                    {!diskGoodType && (
                      <li>Only disk type: "Disk" and "Raid" are accpected. Selected disk: {disk.type}</li>
                    )}
                    {diskRo && <li>Disk is read only</li>}
                    {diskMounted && <li>Disk have a mountpoint</li>}
                  </ul>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </Collapse>
  )
}

const PROVISIONING_MODE = [
  { value: 'thin', label: 'Thin' },
  { value: 'thick', label: 'Thick' },
]

const SettingsSection = decorate([
  provideState({
    initialState: () => ({
      replication: undefined,
      provisioning: PROVISIONING_MODE[0],
    }),
    effects: {
      onReplicationChange: (_, v) => ({ replication: v }),
      onProvisioningChange: (_, p) => ({ provisioning: p.value }),
    },
  }),
  injectState,
  ({ effects, state }) => {
    return (
      <Card>
        <CardHeader>Settings</CardHeader>
        <CardBlock>
          <div className='form-group'>
            <label>
              <strong>Replication</strong>
            </label>
            <Number max={3} min={1} onChange={effects.onReplicationChange} value={state.replication} />
            {state.replication === 1 && <p className='text-warning'>If one disks dies, you lose data Message TBD</p>}
          </div>
          <div className='form-group'>
            <label>
              <strong>Provisioning</strong>
            </label>
            <Select options={PROVISIONING_MODE} onChange={effects.onProvisioningChange} value={state.provisioning} />
          </div>
        </CardBlock>
      </Card>
    )
  },
])

/** @TODO:
 * - use card like backup form
 *
 */
