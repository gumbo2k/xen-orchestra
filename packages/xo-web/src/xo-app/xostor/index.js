import _ from 'intl'
import Icon from 'icon'
import React from 'react'
import { Container } from 'grid'

import XostorList from './xostor-list'

import Page from '../page'

const HEADER = (
  <Container>
    <h2>
      <Icon icon='menu-xostor' /> {_('xostor')}
    </h2>
  </Container>
)

const Xostor = () => (
  <Page header={HEADER}>
    <XostorList />
  </Page>
)

export default Xostor
