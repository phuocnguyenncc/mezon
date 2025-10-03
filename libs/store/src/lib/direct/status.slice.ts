import type { IUserProfileActivity } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';

export const USER_STATUS_FEATURE_KEY = 'USER_STATUS_FEATURE_KEY';

export interface UserStatusState extends EntityState<IUserProfileActivity, string> {
	loadingStatus: 'not loaded' | 'loading' | 'loaded' | 'error';
	error?: string | null;
}

const statusAdapter = createEntityAdapter({
	selectId: (user: IUserProfileActivity) => user.id
});

export const initialUsetStatusState: UserStatusState = statusAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null
});

export const statusSlice = createSlice({
	name: USER_STATUS_FEATURE_KEY,
	initialState: initialUsetStatusState,
	reducers: {
		updateBulkMetadata: (state, action: PayloadAction<IUserProfileActivity[]>) => {
			statusAdapter.upsertMany(state, action.payload);
		}
	}
});

/*
 * Export reducer for store configuration.
 */
export const statusReducer = statusSlice.reducer;

/*
 * Export action creators to be dispatched. For use with the `useDispatch` hook.
 */
export const statusActions = {
	...statusSlice.actions
};

/*
 * Export selectors to query state. For use with the `useSelector` hook.
 */
const { selectAll, selectEntities, selectById } = statusAdapter.getSelectors();

export const getstatusState = (rootState: { [USER_STATUS_FEATURE_KEY]: UserStatusState }): UserStatusState => rootState[USER_STATUS_FEATURE_KEY];

export const selectAllstatus = createSelector(getstatusState, selectAll);

export const selectStatusEntities = createSelector(getstatusState, selectEntities);

export const selectUserStatusById = createSelector([getstatusState, (_, userId: string) => userId], (state, userId) => selectById(state, userId));
