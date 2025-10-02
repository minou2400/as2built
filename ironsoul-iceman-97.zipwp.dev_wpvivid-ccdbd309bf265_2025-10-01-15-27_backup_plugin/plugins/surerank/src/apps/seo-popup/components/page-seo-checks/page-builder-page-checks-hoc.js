import { useSelect, useDispatch } from '@wordpress/data';
import { Suspense, useMemo } from '@wordpress/element';
import { Text } from '@bsf/force-ui';
import { __ } from '@wordpress/i18n';
import { PageChecks } from '..';
import { isBricksBuilder } from './analyzer/utils/page-builder';
import { STORE_NAME } from '@/store/constants';
import PageChecksListSkeleton from './page-checks-list-skeleton';
import { useKeywordChecks } from '@SeoPopup/components/keyword-checks/hooks/use-keyword-checks';

const PageBuilderPageSeoChecksHoc = ( { type = 'page' } ) => {
	const pageSeoChecks = useSelect(
		( select ) => select( STORE_NAME ).getPageSeoChecks(),
		[]
	);

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

	// Get the appropriate checks based on type
	const checksData = useMemo( () => {
		if ( type === 'keyword' ) {
			// For keyword checks, use pre-filtered keyword checks from store
			if ( ! pageSeoChecks.filteredKeywordChecks ) {
				return {};
			}

			return pageSeoChecks.filteredKeywordChecks;
		}

		// For page checks, use pre-filtered page checks from store
		if ( ! pageSeoChecks.filteredPageChecks ) {
			return {};
		}

		return pageSeoChecks.filteredPageChecks;
	}, [ type, keywordChecksResult, pageSeoChecks.filteredPageChecks, pageSeoChecks.filteredKeywordChecks ] );
	const { ignorePageSeoCheck, restorePageSeoCheck } =
		useDispatch( STORE_NAME );

	const handleIgnoreCheck = ( checkId ) => {
		ignorePageSeoCheck( checkId );
	};
	const handleRestoreCheck = ( checkId ) => {
		restorePageSeoCheck( checkId );
	};

	// Bricks builder doesn't support page level SEO checks
	if ( isBricksBuilder() ) {
		return null;
	}

	// Handle the case where no focus keyword is provided for keyword checks
	if ( type === 'keyword' && ! focusKeyword ) {
		return (
			<div className="text-center py-4">
				<Text as="p" color="secondary" size={ 14 }>
					{ __(
						'Enter a focus keyword to see keyword-specific SEO checks.',
						'surerank'
					) }
				</Text>
			</div>
		);
	}

	return (
		<div className="p-1 space-y-2 flex-1 flex flex-col">
			<div className="flex-1">
				<Suspense fallback={ <PageChecksListSkeleton /> }>
					<PageChecks
						type={ type }
						pageSeoChecks={ {
							...pageSeoChecks,
							...checksData,
							isCheckingLinks: pageSeoChecks.isCheckingLinks,
						} }
						onIgnore={ handleIgnoreCheck }
						onRestore={ handleRestoreCheck }
					/>
				</Suspense>
			</div>
		</div>
	);
};

export default PageBuilderPageSeoChecksHoc;
