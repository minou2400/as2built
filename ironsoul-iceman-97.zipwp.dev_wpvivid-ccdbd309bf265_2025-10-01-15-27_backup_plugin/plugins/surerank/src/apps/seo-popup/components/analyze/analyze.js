import { Accordion, Text, Alert } from '@bsf/force-ui';
import { __ } from '@wordpress/i18n';
import { useState, useCallback, useEffect } from '@wordpress/element';
import {
	useSelect,
	useDispatch,
	select as staticSelect,
} from '@wordpress/data';
import RefreshButtonPortal from '@SeoPopup/components/refresh-button-portal';
import { STORE_NAME } from '@/store/constants';
import PageChecksHoc from '@SeoPopup/components/page-seo-checks/page-checks-hoc';
import PageBuilderPageSeoChecksHoc from '@SeoPopup/components/page-seo-checks/page-builder-page-checks-hoc';
import {
	isBricksBuilder,
	isPageBuilderActive,
	isElementorBuilder,
	refreshPageChecks,
} from '@SeoPopup/components/page-seo-checks/analyzer/utils/page-builder';
import { ENABLE_PAGE_LEVEL_SEO } from '@/global/constants';
import usePageCheckStatus from '@SeoPopup/hooks/usePageCheckStatus';

const ChecksComponent = ( { type } ) => {
	if ( ! ENABLE_PAGE_LEVEL_SEO || isBricksBuilder() ) {
		return null;
	}

	const isPageBuilder = isPageBuilderActive();

	if ( isPageBuilder ) {
		return <PageBuilderPageSeoChecksHoc type={ type } />;
	}

	return <PageChecksHoc type={ type } />;
};

const Analyze = () => {
	const isPageBuilder = isPageBuilderActive();

	// Get page check status using existing hook
	const { status: pageCheckStatus } = usePageCheckStatus();

	// Refresh functionality state - only for page builder
	const [ isRefreshing, setIsRefreshing ] = useState( false );
	const [ brokenLinkState, setBrokenLinkState ] = useState( {
		isChecking: false,
		checkedLinks: new Set(),
		brokenLinks: new Set(),
		allLinks: [],
	} );

	const pageSeoChecks = useSelect(
		( select ) => select( STORE_NAME ).getPageSeoChecks(),
		[]
	);

	const modalState = useSelect(
		( select ) => select( STORE_NAME ).getModalState(),
		[]
	);

	const refreshCalled = useSelect(
		( select ) => select( STORE_NAME ).getRefreshCalled(),
		[]
	);

	const { setPageSeoCheck, setRefreshCalled } = useDispatch( STORE_NAME );

	const handleRefreshWithBrokenLinks = useCallback( async () => {
		setRefreshCalled( true );
		await refreshPageChecks(
			setIsRefreshing,
			setBrokenLinkState,
			setPageSeoCheck,
			staticSelect,
			pageSeoChecks,
			brokenLinkState
		);
	}, [
		setIsRefreshing,
		setBrokenLinkState,
		setPageSeoCheck,
		pageSeoChecks,
		brokenLinkState,
		setRefreshCalled,
	] );

	// Auto-refresh functionality for page builders
	useEffect( () => {
		if ( isPageBuilder && modalState && ! refreshCalled ) {
			refreshPageChecks(
				setIsRefreshing,
				setBrokenLinkState,
				setPageSeoCheck,
				staticSelect,
				pageSeoChecks,
				brokenLinkState
			);
			setRefreshCalled( true );
		}
	}, [
		isPageBuilder,
		modalState,
		refreshCalled,
		setPageSeoCheck,
		pageSeoChecks,
		brokenLinkState,
		setRefreshCalled,
	] );

	const PageChecksComponent = ChecksComponent;
	const KeywordChecksComponent = ChecksComponent;

	// Determine default accordion value based on page check status
	const hasPageCheckIssues = pageCheckStatus && pageCheckStatus !== 'success';
	const defaultAccordionValue = hasPageCheckIssues ? 'page-checks' : 'keyword-checks';

	// Early return if no valid component is found.
	if ( ! ENABLE_PAGE_LEVEL_SEO || isBricksBuilder() ) {
		return (
			<div>
				<Text
					color="help"
					size={ 14 }
					className="text-center py-5 border-0.5 border-solid border-border-secondary rounded-md"
				>
					{ __(
						'SEO analysis is not available for this page.',
						'surerank'
					) }
				</Text>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{ /* Show save message only for Elementor */ }
			{ isElementorBuilder() && (
				<div className="[&_p.mr-10]:mr-0">
					<Alert
						variant="info"
						content={
							<span className="flex items-start gap-2">
								<p>
									{ __(
										'Please save changes in the editor before refreshing the checks.',
										'surerank'
									) }
								</p>
								<span className="-mr-3 refresh-button-container shrink-0" />
							</span>
						}
						className="shadow-none"
					/>
				</div>
			) }
			{ /* Render RefreshButtonPortal at top level so it's always available for page builders */ }
			{ isPageBuilder && (
				<RefreshButtonPortal
					isRefreshing={ isRefreshing }
					isChecking={ pageSeoChecks.isCheckingLinks }
					onClick={ handleRefreshWithBrokenLinks }
				/>
			) }
			<Accordion
				autoClose={ true }
				defaultValue={ defaultAccordionValue }
				type="boxed"
			>
				<Accordion.Item
					value="page-checks"
					className="bg-background-primary overflow-hidden"
				>
					<Accordion.Trigger className="text-base [&>svg]:size-5 pr-2 pl-3 py-3">
						{ __( 'Page Checks', 'surerank' ) }
					</Accordion.Trigger>
					<Accordion.Content>
						<div className="pt-3">
							<PageChecksComponent type="page" />
						</div>
					</Accordion.Content>
				</Accordion.Item>
				<Accordion.Item
					value="keyword-checks"
					className="bg-background-primary overflow-hidden"
				>
					<Accordion.Trigger className="text-base [&>svg]:size-5 pr-2 pl-3 py-3">
						{ __( 'Keyword Checks', 'surerank' ) }
					</Accordion.Trigger>
					<Accordion.Content>
						<div className="pt-3">
							<KeywordChecksComponent type="keyword" />
						</div>
					</Accordion.Content>
				</Accordion.Item>
			</Accordion>
		</div>
	);
};

export default Analyze;
