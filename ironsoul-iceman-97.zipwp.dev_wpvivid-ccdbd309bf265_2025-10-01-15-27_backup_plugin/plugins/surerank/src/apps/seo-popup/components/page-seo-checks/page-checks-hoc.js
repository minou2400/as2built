import { useSuspenseSelect, useDispatch, useSelect } from '@wordpress/data';
import { useMemo, Suspense } from '@wordpress/element';
import { STORE_NAME } from '@/store/constants';
import PageChecks from './page-checks';
import { ENABLE_PAGE_LEVEL_SEO } from '@Global/constants';
import { __ } from '@wordpress/i18n';
import { Text } from '@bsf/force-ui';
import PageChecksListSkeleton from './page-checks-list-skeleton';
import { useKeywordChecks } from '@SeoPopup/components/keyword-checks/hooks/use-keyword-checks';

const PageSeoChecksWrapper = ( { type = 'page' } ) => {
	const { pageSeoChecks } = useSuspenseSelect( ( sel ) => {
		const selectors = sel( STORE_NAME );
		return {
			pageSeoChecks: selectors?.getPageSeoChecks() || {},
		};
	}, [] );

	// For keyword checks, we need focus keyword and ignored list
	const { focusKeyword, ignoredList } = useSelect( ( select ) => {
		const selectors = select( STORE_NAME );
		return {
			focusKeyword: selectors?.getPostSeoMeta?.()?.focus_keyword,
			ignoredList: selectors.getCurrentPostIgnoredList(),
		};
	}, [] );

	// Use keyword checks hook when type is keyword
	const keywordChecksResult = useKeywordChecks( {
		focusKeyword: type === 'keyword' ? focusKeyword : null,
		ignoredList,
	} );

	const { ignorePageSeoCheck, restorePageSeoCheck } =
		useDispatch( STORE_NAME );

	// Get the appropriate checks based on type
	const checksData = useMemo( () => {
		if ( type === 'keyword' ) {
			// For keyword checks, return the client-side computed results
			return keywordChecksResult;
		}

		// For page checks, use pre-filtered checks from store
		if ( ! pageSeoChecks.filteredPageChecks ) {
			return {};
		}

		return pageSeoChecks.filteredPageChecks;
	}, [ type, keywordChecksResult, pageSeoChecks.filteredPageChecks ] );

	const handleIgnoreCheck = ( checkId ) => {
		ignorePageSeoCheck( checkId );
	};
	const handleRestoreCheck = ( checkId ) => {
		restorePageSeoCheck( checkId );
	};

	// Handle the case where no focus keyword is provided for keyword checks
	if ( type === 'keyword' && ! focusKeyword ) {
		return (
			<div className="text-center py-4">
				<Text as="p" color="secondary" size={ 14 }>
					{ __(
						'To see keyword-specific SEO checks, first set a focus keyword under the Optimize tab.',
						'surerank'
					) }
				</Text>
			</div>
		);
	}

	return (
		<PageChecks
			type={ type }
			pageSeoChecks={ {
				...pageSeoChecks,
				...checksData,
			} }
			onIgnore={ handleIgnoreCheck }
			onRestore={ handleRestoreCheck }
		/>
	);
};

const WithPageSeoChecks = ( { type = 'page' } ) => {
	if ( ENABLE_PAGE_LEVEL_SEO === false ) {
		return null;
	}

	return (
		<Suspense fallback={ <PageChecksListSkeleton /> }>
			<PageSeoChecksWrapper type={ type } />
		</Suspense>
	);
};

export default WithPageSeoChecks;
