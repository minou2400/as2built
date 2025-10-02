import { pick } from 'lodash';
import { select } from '@wordpress/data';
import { STORE_NAME } from './constants';
import * as actionTypes from './action-types';
import { getCategorizedChecks } from '@/functions/utils';
/**
 * Returns an action object used in signalling that viewport queries have been
 * updated. Values are specified as an object of breakpoint query keys where
 * value represents whether query matches.
 * Ignored from documentation as it is for internal use only.
 *
 * @param {string} value Value to update.
 */
export function updatePostSeoMeta( value ) {
	return {
		type: 'UPDATE_POST_SEO_META',
		value,
	};
}

export function updateMetaboxState( value ) {
	return {
		type: 'UPDATE_METABOX_STATE',
		value,
	};
}

export function updateModalState( value ) {
	return {
		type: 'UPDATE_MODAL_STATE',
		value,
	};
}

// To create content dynamically.
export function updatePostDynamicData( value ) {
	return {
		type: 'UPDATE_DYNAMIC_DATA',
		value,
	};
}

export function* updatePostMetaData( value ) {
	yield setUnsavedMetaSettings( value );

	return {
		type: actionTypes.UPDATE_META_DATA,
		value,
	};
}

export function updateInitialState( value ) {
	return {
		type: 'UPDATE_INITIAL_STATE',
		value,
	};
}

export const updateGlobalDefaults = ( payload ) => ( {
	type: actionTypes.UPDATE_GLOBAL_DEFAULTS,
	payload,
} );

export function* initMetaDataAndDefaults( { postSeoMeta, globalDefaults } ) {
	let postSeoMetaObj = postSeoMeta;
	if ( postSeoMetaObj && ! Object.keys( postSeoMetaObj ).length ) {
		postSeoMetaObj = select( STORE_NAME ).getPostSeoMeta();
		postSeoMetaObj = pick( globalDefaults, Object.keys( postSeoMetaObj ) );
		yield updatePostMetaData( postSeoMetaObj );
	} else {
		yield updatePostSeoMeta( postSeoMetaObj );
	}
	return updateGlobalDefaults( globalDefaults );
}

export function updateAppSettings( value ) {
	return {
		type: actionTypes.UPDATE_APP_SETTINGS,
		value,
	};
}

export const setPageSeoCheck = ( key, value ) => {
	let payload = { [ key ]: value };

	if ( key === 'checks' ) {
		const state = select( STORE_NAME ).getState();
		const ignoredList = state.pageSeoChecks?.ignoredList || [];

		const categorizedChecks = getCategorizedChecks( value, ignoredList );

		// Filter checks by allowed page checks to avoid filtering on every render
		const allowedPageChecks = window?.surerank_seo_popup?.page_checks || [];
		const allowedKeywordChecks = window?.surerank_seo_popup?.keyword_checks || [];

		const filterChecksByType = ( checksArray, allowedChecks ) => {
			return checksArray.filter( ( check ) => allowedChecks.includes( check.id ) );
		};

		const filteredPageChecks = {
			badChecks: filterChecksByType( categorizedChecks.badChecks || [], allowedPageChecks ),
			fairChecks: filterChecksByType( categorizedChecks.fairChecks || [], allowedPageChecks ),
			passedChecks: filterChecksByType( categorizedChecks.passedChecks || [], allowedPageChecks ),
			ignoredChecks: filterChecksByType( categorizedChecks.ignoredChecks || [], allowedPageChecks ),
			suggestionChecks: filterChecksByType( categorizedChecks.suggestionChecks || [], allowedPageChecks ),
		};

		const filteredKeywordChecks = {
			badChecks: filterChecksByType( categorizedChecks.badChecks || [], allowedKeywordChecks ),
			fairChecks: filterChecksByType( categorizedChecks.fairChecks || [], allowedKeywordChecks ),
			passedChecks: filterChecksByType( categorizedChecks.passedChecks || [], allowedKeywordChecks ),
			ignoredChecks: filterChecksByType( categorizedChecks.ignoredChecks || [], allowedKeywordChecks ),
			suggestionChecks: filterChecksByType( categorizedChecks.suggestionChecks || [], allowedKeywordChecks ),
		};

		payload = {
			checks: value,
			categorizedChecks,
			filteredPageChecks,
			filteredKeywordChecks,
		};
	}

	return {
		type: actionTypes.SET_PAGE_SEO_CHECK,
		payload,
	};
};

export const setUnsavedMetaSettings = ( payload ) => {
	return {
		type: actionTypes.SET_UNSAVED_META_SETTINGS,
		payload,
	};
};

export const resetUnsavedMetaSettings = () => {
	return {
		type: actionTypes.RESET_UNSAVED_META_SETTINGS,
	};
};

export const setRefreshCalled = ( value ) => ( {
	type: actionTypes.SET_REFRESH_CALLED,
	value,
} );

export const setCurrentPostIgnoredList = ( payload ) => ( {
	type: actionTypes.SET_CURRENT_POST_IGNORED_LIST,
	payload,
} );

export function fetchFromAPI( payload ) {
	return {
		type: actionTypes.FETCH_FROM_API,
		payload,
	};
}

export function* restoreIgnoreCheck( checkId, actionType ) {
	const state = select( STORE_NAME ).getState();
	const postId =
		state.pageSeoChecks?.postId ||
		state.variables?.post?.ID?.value ||
		state.variables?.term?.ID?.value;
	const checkType =
		window?.surerank_seo_popup?.is_taxonomy === '1' ? 'taxonomy' : 'post';

	try {
		const data = yield fetchFromAPI( {
			path: 'surerank/v1/checks/ignore-page-check',
			method: actionType === 'ignore' ? 'POST' : 'DELETE',
			data: { post_id: postId, id: checkId, check_type: checkType },
		} );

		// Update ignoredList with the array of IDs
		yield setCurrentPostIgnoredList( data?.checks );

		const { checks } = select( STORE_NAME ).getPageSeoChecks();
		yield setPageSeoCheck( 'checks', checks );
	} catch ( error ) {
		// Silently fail for aborted requests
	}
}

export function* ignorePageSeoCheck( checkId ) {
	yield restoreIgnoreCheck( checkId, 'ignore' );
}

export function* restorePageSeoCheck( checkId ) {
	yield restoreIgnoreCheck( checkId, 'restore' );
}

export const setPageSeoChecksByIdAndType = (
	postId,
	postType,
	checks,
	error = null
) => {
	const sequence = [];
	// Filter checks and reorganize them
	const categorizedChecks = checks.reduce(
		( acc, check ) => {
			// For preserving the order of the checks
			sequence.push( check.id );

			if ( check?.ignore ) {
				acc.ignoredChecks.push( check );
			} else {
				// set the flag to false to show the check in the UI
				check.ignore = false;

				if ( check.status === 'error' ) {
					acc.badChecks.push( check );
				} else if ( check.status === 'warning' ) {
					acc.fairChecks.push( check );
				} else if ( check.status === 'suggestion' ) {
					acc.suggestionChecks.push( check );
				} else if ( check.status === 'success' ) {
					acc.passedChecks.push( check );
				}
			}
			return acc;
		},
		{
			badChecks: [],
			fairChecks: [],
			suggestionChecks: [],
			passedChecks: [],
			ignoredChecks: [],
		}
	);

	// Filter checks by allowed page checks to avoid filtering on every render
	const allowedPageChecks = window?.surerank_seo_popup?.page_checks || [];
	const allowedKeywordChecks = window?.surerank_seo_popup?.keyword_checks || [];

	const filterChecksByType = ( checksArray, allowedChecks ) => {
		return checksArray.filter( ( check ) => allowedChecks.includes( check.id ) );
	};

	const filteredPageChecks = {
		badChecks: filterChecksByType( categorizedChecks.badChecks || [], allowedPageChecks ),
		fairChecks: filterChecksByType( categorizedChecks.fairChecks || [], allowedPageChecks ),
		passedChecks: filterChecksByType( categorizedChecks.passedChecks || [], allowedPageChecks ),
		ignoredChecks: filterChecksByType( categorizedChecks.ignoredChecks || [], allowedPageChecks ),
		suggestionChecks: filterChecksByType( categorizedChecks.suggestionChecks || [], allowedPageChecks ),
	};

	const filteredKeywordChecks = {
		badChecks: filterChecksByType( categorizedChecks.badChecks || [], allowedKeywordChecks ),
		fairChecks: filterChecksByType( categorizedChecks.fairChecks || [], allowedKeywordChecks ),
		passedChecks: filterChecksByType( categorizedChecks.passedChecks || [], allowedKeywordChecks ),
		ignoredChecks: filterChecksByType( categorizedChecks.ignoredChecks || [], allowedKeywordChecks ),
		suggestionChecks: filterChecksByType( categorizedChecks.suggestionChecks || [], allowedKeywordChecks ),
	};

	return {
		type: actionTypes.SET_PAGE_SEO_CHECKS_BY_ID_AND_TYPE,
		payload: {
			postId,
			postType,
			checks: categorizedChecks,
			filteredPageChecks,
			filteredKeywordChecks,
			sequence,
			error,
		},
	};
};

function* handleSeoBarCheckIgnoreUpdate(
	checkId,
	postId,
	postType,
	method,
	value
) {
	try {
		const response = yield fetchFromAPI( {
			path: 'surerank/v1/checks/ignore-page-check',
			method,
			data: { post_id: postId, id: checkId, check_type: postType },
		} );

		if ( response?.status !== 'success' ) {
			throw new Error( response?.message );
		}

		const { checks, sequence } = select( STORE_NAME ).getSeoBarChecks(
			postId,
			postType
		);
		const flatChecks = Object.values( checks )
			.flat()
			.map( ( check ) => {
				if ( check.id === checkId ) {
					check.ignore = value;
				}
				return check;
			} )
			.sort(
				( a, b ) => sequence.indexOf( a.id ) - sequence.indexOf( b.id )
			);

		yield setPageSeoChecksByIdAndType( postId, postType, flatChecks );
	} catch ( error ) {
		// Silently fail for aborted requests
	}
}

export function* ignoreSeoBarCheck( checkId, postId, postType ) {
	yield handleSeoBarCheckIgnoreUpdate(
		checkId,
		postId,
		postType,
		'POST',
		true
	);
}

export function* restoreSeoBarCheck( checkId, postId, postType ) {
	yield handleSeoBarCheckIgnoreUpdate(
		checkId,
		postId,
		postType,
		'DELETE',
		false
	);
}
