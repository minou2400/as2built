import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { STORE_NAME } from '@/store/constants';
import { calculateCheckStatus, calculateCombinedStatus } from '../utils/calculate-check-status';
import { useKeywordChecks } from '@SeoPopup/components/keyword-checks/hooks/use-keyword-checks';

/**
 * A simplified hook for getting page check status without suspense
 * Safe to use in components that can't be wrapped in Suspense
 *
 * @return {Object} Status data object with status, initializing, and counts
 */
const usePageCheckStatus = () => {
	const {
		categorizedChecks = {},
		initializing = true,
		focusKeyword = '',
		ignoredList = [],
	} = useSelect( ( select ) => {
		const storeSelectors = select( STORE_NAME );

		const pageSeoChecks = storeSelectors.getPageSeoChecks();

		return {
			categorizedChecks: pageSeoChecks.categorizedChecks,
			initializing: pageSeoChecks.initializing,
			focusKeyword: storeSelectors?.getPostSeoMeta?.()?.focus_keyword,
			ignoredList: pageSeoChecks.ignoredList,
		};
	}, [] );

	// Get keyword checks data
	const keywordChecks = useKeywordChecks( {
		focusKeyword,
		ignoredList,
	} );

	const { status, counts } = useMemo(
		() => {
			// Calculate page check status
			const pageStatus = calculateCheckStatus( categorizedChecks ) ?? {
				status: null,
				initializing: true,
				counts: { errorAndWarnings: 0 },
			};

			const keywordStatus = calculateCheckStatus( keywordChecks ) ?? {
				status: null,
				initializing: true,
				counts: { errorAndWarnings: 0 },
			};

			// If no focus keyword, return only page status
			if ( ! focusKeyword ) {
				return pageStatus;
			}

			// Calculate combined status from page and keyword checks
			return calculateCombinedStatus( pageStatus, keywordStatus );
		},
		[ categorizedChecks, keywordChecks, focusKeyword ]
	);

	return { status, initializing, counts };
};

export default usePageCheckStatus;
