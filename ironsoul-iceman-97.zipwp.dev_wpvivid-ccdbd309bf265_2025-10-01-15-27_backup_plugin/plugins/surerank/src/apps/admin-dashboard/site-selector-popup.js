import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	toast,
	Loader,
	Skeleton,
	Container,
	Alert,
	Text,
} from '@bsf/force-ui';
import { useDispatch, useSuspenseSelect, useSelect } from '@wordpress/data';
import { STORE_NAME } from '@/admin-store/constants';
import { __ } from '@wordpress/i18n';
import { useState, Suspense } from '@wordpress/element';
import { handleDisconnectConfirm } from '../admin-components/user-dropdown';
import { X } from 'lucide-react';
import ModalWrapper from '@AdminComponents/modal-wrapper';
import useSiteVerificationStatus, {
	normalizeUrl,
} from './use-site-verification-status';
import SiteSelector from './site-selector';

const SiteSelectorPopup = () => {
	const { toggleSiteSelectorModal } = useDispatch( STORE_NAME );
	const searchConsole = useSelect(
		( select ) => select( STORE_NAME ).getSearchConsole(),
		[]
	);

	const isSiteSelected = () => {
		return !! searchConsole?.hasSiteSelected;
	};

	return (
		<ModalWrapper
			maxWidth="max-w-[480px]"
			isOpen={ toggleSiteSelectorModal }
		>
			<Container
				className="relative bg-white rounded-lg shadow-lg max-w-md w-full"
				direction="column"
				gap="xs"
			>
				{ /* Header */ }
				<Container
					className="border-b border-gray-200 p-5 pb-2"
					justify="between"
					align="start"
					gap="xs"
					direction="column"
				>
					<Container
						justify="between"
						align="start"
						gap="xs"
						className="w-full"
					>
						<Text className="text-lg font-semibold">
							{ __( 'Search Console Account', 'surerank' ) }
						</Text>
						{ isSiteSelected() && (
							<Button
								icon={ <X /> }
								onClick={ toggleSiteSelectorModal }
								variant="ghost"
								className="p-0"
							/>
						) }
					</Container>
					<Container direction="column" gap="xs">
						<Text className="text-sm text-gray-600">
							{ __(
								'Please select a site below to view its data.',
								'surerank'
							) }
						</Text>
					</Container>
				</Container>

				{ /* Body */ }
				<Suspense
					fallback={
						<Container direction="column" className="gap-5">
							<Container
								direction="column"
								className="gap-1.5 px-5 pt-2"
							>
								<Skeleton className="h-5 w-1/4" />
								<Skeleton className="h-10 w-full" />
							</Container>
							<Container justify="end" className="p-4 gap-3">
								<Skeleton className="h-10 w-20" />
								<Skeleton className="h-10 w-20" />
							</Container>
						</Container>
					}
				>
					<SiteSelectorInputs />
				</Suspense>
			</Container>
		</ModalWrapper>
	);
};

const SiteSelectorInputs = () => {
	const searchConsole = useSuspenseSelect(
		( select ) => select( STORE_NAME ).getSearchConsole(),
		[]
	);
	const { toggleSiteSelectorModal, setSearchConsole, setConfirmationModal } =
		useDispatch( STORE_NAME );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ isCreatingProperty, setIsCreatingProperty ] = useState( false );

	// Check if current site is in the available sites list
	const getCurrentSiteUrl = () => {
		// Get current site URL from window location or WordPress localized data
		return window.location.origin;
	};

	const currentSiteUrl = getCurrentSiteUrl();

	// Set default selected site - if current site is not in list, use current site URL
	const [ selectedSite, setSelectedSite ] = useState( () => {
		const isCurrentSiteInList = searchConsole?.sites?.some(
			( site ) =>
				site.siteUrl === currentSiteUrl ||
				site.siteUrl === `${ currentSiteUrl }/` ||
				normalizeUrl( site.siteUrl ) === normalizeUrl( currentSiteUrl )
		);
		return ! isCurrentSiteInList
			? currentSiteUrl
			: searchConsole?.selectedSite ||
					searchConsole?.tempSelectedSite ||
					currentSiteUrl;
	} );

	// Use the custom hook for site verification status
	const {
		isSelectedSiteVerified,
		currentSiteInListButNotVerified,
		shouldShowConnectAlert,
	} = useSiteVerificationStatus(
		selectedSite,
		currentSiteUrl,
		searchConsole
	);

	const handleSelectSite = ( site ) => {
		setSelectedSite( site );
	};

	const handleDisconnect = () => {
		setConfirmationModal( {
			open: true,
			title: __( 'Disconnect Search Console Account', 'surerank' ),
			description: __(
				'Are you sure you want to disconnect your Search Console account from SureRank?',
				'surerank'
			),
			onConfirm: handleDisconnectConfirm,
			confirmButtonText: __( 'Disconnect', 'surerank' ),
		} );
	};

	const handleCreateProperty = async () => {
		if ( isCreatingProperty ) {
			return;
		}

		setIsCreatingProperty( true );

		try {
			// Use different endpoints based on whether site exists or not
			const endpoint = currentSiteInListButNotVerified
				? '/surerank/v1/google-search-console/verify-site'
				: '/surerank/v1/google-search-console/add-site';

			const response = await apiFetch( {
				path: endpoint,
				method: 'POST',
			} );

			if ( ! response.success ) {
				throw new Error(
					response.message ??
						__( 'Failed to create property', 'surerank' )
				);
			}

			// Handle pending verification case
			if ( response.pending ) {
				toast.success(
					currentSiteInListButNotVerified
						? __( 'Verification started successfully!', 'surerank' )
						: __( 'Property created successfully!', 'surerank' ),
					{
						description: __(
							'Verification is pending and may take 1-2 hours or up to 2 days. Your site has been added to Search Console. Reloading in 2 seconds…',
							'surerank'
						),
					}
				);
			} else {
				toast.success(
					currentSiteInListButNotVerified
						? __( 'Property verified successfully!', 'surerank' )
						: __(
								'Property created and verified successfully!',
								'surerank'
						  ),
					{
						description: __(
							'The changes will take effect after a page refresh. Reloading in 2 seconds…',
							'surerank'
						),
					}
				);
			}

			// Reload page after 2 seconds
			setTimeout( () => {
				window.location.reload();
			}, 2000 );
		} catch ( error ) {
			toast.error( error.message );
		} finally {
			setIsCreatingProperty( false );
		}
	};

	const handleProceed = async () => {
		if ( isLoading ) {
			return;
		}

		// Proceed with site selection only
		if ( ! selectedSite ) {
			toast.error( __( 'Please select a site', 'surerank' ) );
			return;
		}

		setIsLoading( true );
		try {
			const response = await apiFetch( {
				path: '/surerank/v1/google-search-console/site',
				method: 'PUT',
				data: { url: selectedSite },
			} );
			if ( ! response.success ) {
				throw new Error(
					response.message ?? __( 'Failed to proceed', 'surerank' )
				);
			}
			toast.success( __( 'Site selected successfully', 'surerank' ) );
			toggleSiteSelectorModal();
			setSearchConsole( {
				selectedSite,
				hasSiteSelected: true,
			} );
		} catch ( error ) {
			toast.error( error.message );
		} finally {
			setIsLoading( false );
		}
	};

	return (
		<>
			<Container direction="column" gap="xs" className="p-5 pt-2 pb-3">
				<SiteSelector
					sites={ searchConsole?.sites || [] }
					currentSiteUrl={ currentSiteUrl }
					selectedSite={ selectedSite }
					onSiteSelect={ handleSelectSite }
					placeholder={ __( 'Select a site', 'surerank' ) }
				/>

				{ shouldShowConnectAlert && (
					<Container className="mt-4">
						<div>
							<Alert
								variant="info"
								className="shadow-none m-0 [&>div>p]:mr-0"
								content={
									<div className="flex flex-col gap-3">
										<div className="flex flex-col gap-1">
											<span className="text-text-primary text-sm font-semibold">
												{ __(
													"Let's Get Your Site Connected",
													'surerank'
												) }
											</span>

											<p className="text-text-primary text-sm">
												{ __(
													'Connect it now to see SureRank insights. Your site will usually be verified instantly, though Google may take up to 1-2 days in some situations.',
													'surerank'
												) }{ ' ' }
												<a
													href="https://support.google.com/webmasters/answer/34592?hl=en"
													target="_blank"
													rel="noopener noreferrer"
													className="text-text-secondary"
												>
													{ __(
														'Learn more',
														'surerank'
													) }
												</a>
											</p>
										</div>
									</div>
								}
							/>
						</div>
					</Container>
				) }
			</Container>
			{ /* Footer */ }
			<SiteSelectorFooter
				currentSiteUrl={ currentSiteUrl }
				isLoading={ isLoading }
				isCreatingProperty={ isCreatingProperty }
				selectedSite={ selectedSite }
				isSelectedSiteVerified={ isSelectedSiteVerified }
				handleDisconnect={ handleDisconnect }
				handleProceed={ handleProceed }
				handleCreateProperty={ handleCreateProperty }
			/>
		</>
	);
};

const SiteSelectorFooter = ( {
	currentSiteUrl,
	isLoading,
	isCreatingProperty,
	selectedSite,
	isSelectedSiteVerified,
	handleDisconnect,
	handleProceed,
	handleCreateProperty,
} ) => {
	// Check if current site is selected and not verified
	const isCurrentSiteSelectedAndUnverified =
		normalizeUrl( selectedSite ) === normalizeUrl( currentSiteUrl ) &&
		! isSelectedSiteVerified;

	return (
		<Container
			className="border-0 border-solid border-t border-gray-200 gap-3 p-4"
			justify="between"
		>
			<Button
				destructive
				iconPosition="left"
				size="md"
				tag="button"
				type="button"
				variant="link"
				onClick={ handleDisconnect }
			>
				{ __( 'Disconnect', 'surerank' ) }
			</Button>

			{ isCurrentSiteSelectedAndUnverified ? (
				<Button
					variant="primary"
					size="md"
					onClick={ handleCreateProperty }
					icon={
						isCreatingProperty && <Loader variant="secondary" />
					}
					iconPosition="left"
					disabled={ isCreatingProperty || isLoading }
				>
					{ isCreatingProperty
						? __( 'Connecting your site…', 'surerank' )
						: __( 'Connect Site', 'surerank' ) }
				</Button>
			) : (
				<Button
					variant="primary"
					size="md"
					onClick={ handleProceed }
					icon={ isLoading && <Loader variant="secondary" /> }
					iconPosition="left"
					disabled={
						isLoading ||
						isCreatingProperty ||
						! selectedSite ||
						! isSelectedSiteVerified
					}
				>
					{ __( 'Select Site', 'surerank' ) }
				</Button>
			) }
		</Container>
	);
};

export default SiteSelectorPopup;
