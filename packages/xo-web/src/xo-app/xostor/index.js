import _ from 'intl'

import decorate from 'apply-decorators'
import React from 'react'
import { connectStore } from 'utils'
import { Container, Col, Row } from 'grid'
import { injectState, provideState } from 'reaclette'

import Page from '../page'
import { SelectPool } from '../../common/select-objects'
import { createGetObjectsOfType } from '../../common/selectors'
import { toggleState } from '../../common/reaclette-utils'
import { Pool } from '../../common/render-xo-item'
import ActionButton from '../../common/action-button'
import Icon from 'icon'

const N_HOSTS_MIN = 3
const N_HOSTS_MAX = 7

// ===================================================================

const alreadyHasXostore = () => false // @TODO: Check is xostore already exist in the pool

const isGoodNumberOfHosts = hosts => hosts.length >= N_HOSTS_MIN && hosts.length <= N_HOSTS_MAX

const isXcpngPool = host => host.productBrand === 'XCP-ng'

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
      hostsByPoolId: createGetObjectsOfType('host').groupBy('$pool'),
    }
  }),
  provideState({
    initialState: () => ({
      onlyShowXostorePools: false, // @TODO: Default to true
      poolId: undefined,
      hostsPool: [],
    }),
    effects: {
      toggleState,
      onChange: function (_, pool) {
        return { poolId: pool.id, hostsPool: Object.values(this.props.hostsByPoolId[pool.id]) }
      },
    },
    computed: {
      // Form ====================================================================
      isFormInvalid: state => state.isPoolCompatibleXostore,
      xostorePoolPredicate: (state, props) => pool => {
        if (!state.onlyShowXostorePools) {
          return true
        }
        const hostsPool = Object.values(props.hostsByPoolId[pool.id])
        return isGoodNumberOfHosts(hostsPool) && isXcpngPool(hostsPool[0]) && !alreadyHasXostore()
      },

      // Selected Pool ===========================================================
      isXcpngPool: state => isXcpngPool(state.hostsPool[0]),
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
          <div>
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
        </Container>
      </Page>
    )
  },
])
