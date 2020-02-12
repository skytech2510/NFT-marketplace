import React, { useState, useCallback, useEffect } from 'react'
import { fromWei } from 'web3x-es/utils'
import { t, T } from 'decentraland-dapps/dist/modules/translation/utils'
import dateFnsFormat from 'date-fns/format'
import { MANA_SYMBOL, toMANA, fromMANA } from '../../../lib/mana'
import { NFTAction } from '../../NFTAction'
import { Header, Field, Button, Modal, Mana } from 'decentraland-ui'
import {
  INPUT_FORMAT,
  getDefaultExpirationDate
} from '../../../modules/order/utils'
import { getNFTName, isOwnedBy } from '../../../modules/nft/utils'
import { locations } from '../../../modules/routing/locations'
import { hasAuthorization } from '../../../modules/authorization/utils'
import { contractAddresses } from '../../../modules/contract/utils'
import { AuthorizationType } from '../../AuthorizationModal/AuthorizationModal.types'
import { AuthorizationModal } from '../../AuthorizationModal'
import { Props } from './SellModal.types'
import './SellModal.css'

const SellModal = (props: Props) => {
  const { nft, order, wallet, onNavigate, onCreateOrder } = props
  const isUpdate = order !== null
  const [price, setPrice] = useState(
    isUpdate ? toMANA(+fromWei(order!.price, 'ether')) : ''
  )
  const [expiresAt, setExpiresAt] = useState(
    isUpdate
      ? dateFnsFormat(new Date(+order!.expiresAt), INPUT_FORMAT)
      : getDefaultExpirationDate()
  )
  const [confirmPrice, setConfirmPrice] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  const [showAuthorizationModal, setShowAuthorizationModal] = useState(false)

  const handleCreateOrder = useCallback(
    () => onCreateOrder(nft, fromMANA(price), +new Date(expiresAt)),
    [nft, price, expiresAt, onCreateOrder]
  )

  const handleSubmit = useCallback(() => {
    if (
      hasAuthorization(
        contractAddresses.Marketplace,
        nft.contractAddress,
        AuthorizationType.APPROVAL
      )
    ) {
      handleCreateOrder()
    } else {
      setShowAuthorizationModal(true)
      setShowConfirm(false)
    }
  }, [nft, handleCreateOrder, setShowAuthorizationModal])

  const handleClose = useCallback(() => setShowAuthorizationModal(false), [
    setShowAuthorizationModal
  ])

  const isInvalidDate = +new Date(expiresAt) < Date.now()

  // clear confirm price when closing the confirm modal
  useEffect(() => {
    if (!showConfirm) {
      setConfirmPrice('')
    }
  }, [showConfirm, setConfirmPrice])

  return (
    <NFTAction nft={nft}>
      <Header size="large">
        {t(isUpdate ? 'sell_page.update_title' : 'sell_page.title')}
      </Header>
      <p className="subtitle">
        <T
          id={isUpdate ? 'sell_page.update_subtitle' : 'sell_page.subtitle'}
          values={{
            name: <b className="primary-text">{getNFTName(nft)}</b>
          }}
        />
      </p>
      <div className="fields">
        <Field
          label={t('sell_page.price')}
          placeholder={MANA_SYMBOL + ' ' + (1000).toLocaleString()}
          value={price}
          onChange={(_event, props) => {
            const newPrice = fromMANA(props.value)
            setPrice(newPrice > 0 ? toMANA(newPrice) : '')
          }}
        />
        <Field
          label={t('sell_page.expiration_date')}
          type="date"
          value={expiresAt}
          onChange={(_event, props) =>
            setExpiresAt(props.value || getDefaultExpirationDate())
          }
          error={isInvalidDate}
          message={isInvalidDate ? t('sell_page.invalid_date') : undefined}
        />
      </div>
      <div className="buttons">
        <Button
          onClick={() =>
            onNavigate(locations.ntf(nft.contractAddress, nft.tokenId))
          }
        >
          {t('global.cancel')}
        </Button>
        <Button
          primary
          disabled={
            !isOwnedBy(nft, wallet) || fromMANA(price) <= 0 || isInvalidDate
          }
          onClick={() => setShowConfirm(true)}
        >
          {t(isUpdate ? 'sell_page.update_submit' : 'sell_page.submit')}
        </Button>
      </div>
      <Modal size="small" open={showConfirm} className="ConfirmPriceModal">
        <Modal.Header>{t('sell_page.confirm.title')}</Modal.Header>
        <Modal.Content>
          <T
            id="sell_page.confirm.line_one"
            values={{
              name: <b>{getNFTName(nft)}</b>,
              amount: <Mana inline>{fromMANA(price).toLocaleString()}</Mana>
            }}
          />
          <br />
          <T id="sell_page.confirm.line_two" />
          <Field
            label={t('sell_page.price')}
            placeholder={price}
            value={confirmPrice}
            onChange={(_event, props) => {
              const newPrice = fromMANA(props.value)
              setConfirmPrice(newPrice > 0 ? toMANA(newPrice) : '')
            }}
          />
        </Modal.Content>
        <Modal.Actions>
          <Button
            onClick={() => {
              setConfirmPrice('')
              setShowConfirm(false)
            }}
          >
            {t('global.cancel')}
          </Button>
          <Button
            primary
            disabled={fromMANA(price) !== fromMANA(confirmPrice)}
            onClick={handleSubmit}
          >
            {t('global.proceed')}
          </Button>
        </Modal.Actions>
      </Modal>
      <AuthorizationModal
        open={showAuthorizationModal}
        contractAddress={contractAddresses.Marketplace}
        tokenAddress={nft.contractAddress}
        type={AuthorizationType.APPROVAL}
        onProceed={handleCreateOrder}
        onCancel={handleClose}
      />
    </NFTAction>
  )
}

export default React.memo(SellModal)
