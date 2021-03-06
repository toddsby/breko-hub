import { put, fork, take, race, select } from 'redux-saga/effects'
import { delay } from 'redux-saga'
import * as selectors from 'app/selectors'
import { removeMessage, ADD_MESSAGE, REMOVE_MESSAGE } from 'app/actions/flash'

const DAEMON = true
const log = {
  sagas: debug('sagas'),
}

export function * timeoutRemoveFlash(nextFlash) {
  if (nextFlash) {
    const { removed } = yield race({
      timeout: delay(4000),
      removed: take(action =>
        action.type === REMOVE_MESSAGE
        && action.id === nextFlash.id
      ),
    })
    if (!removed) {
      yield put(removeMessage(nextFlash.id))
    }
  }
}

export function * takeFlashMessages() {
  while (DAEMON) {
    const action = yield take(ADD_MESSAGE)
    log.sagas('Flash added, saga will remove it automatically')
    yield fork(timeoutRemoveFlash, action.payload)
  }
}

export default function * rootSaga() {
  const nextFlash = yield select(selectors.nextFlashMessage)
  yield fork(timeoutRemoveFlash, nextFlash)
  yield fork(takeFlashMessages)
}
