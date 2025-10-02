import { Container, Label, toast } from '@bsf/force-ui';
import { __ } from '@wordpress/i18n';
import { useEffect, useCallback } from '@wordpress/element';
import { usePluginsAndThemes } from './use-plugins-and-themes';
import { PluginCard } from './plugin-card';
import {
	themesAndPlugins,
	dashboard_plugins_sequence,
} from './dashboard-constants';
import { Ticket, MessageSquare, Star, Info } from 'lucide-react';
import { SureRankMonoLogo } from '@/global/components/icons';
import { SiteSeoChecksSummary } from './site-seo-checks';
import { useNavigate } from '@tanstack/react-router';
const quickLinks = [
	{
		label: __( 'Open Support Ticket', 'surerank' ),
		icon: <Ticket className="size-4" />,
		link: surerank_globals.support_link,
		external: true,
	},
	{
		label: __( 'Help Center', 'surerank' ),
		icon: <Info className="size-4" />,
		link: surerank_globals.help_link,
		external: true,
	},
	{
		label: __( 'Join our Community on Facebook', 'surerank' ),
		icon: <MessageSquare className="size-4" />,
		link: surerank_globals.community_link,
		external: true,
	},
	{
		label: __( 'Leave Us a Review', 'surerank' ),
		icon: <Star className="size-4" />,
		link: surerank_globals.rating_link,
		external: true,
	},
];

const onboardingSetup = [
	{
		label: __( 'Launch Setup Wizard', 'surerank' ),
		icon: <SureRankMonoLogo className="size-4" />,
		link: surerank_globals.wp_dashboard_url + '?page=surerank_onboarding',
		external: false,
	},
];

const quickAccessLinks =
	'yes' !== surerank_admin_common?.onboarding_complete_status
		? [ ...onboardingSetup, ...quickLinks ]
		: [ ...quickLinks ];

const SequencedThemesAndPlugins = dashboard_plugins_sequence
	.map( ( slug ) => themesAndPlugins.find( ( item ) => item.slug === slug ) )
	.filter( Boolean );

const Dashboard = () => {
	const navigate = useNavigate();
	const {
		fetchStatus,
		fetchInstalledPluginsAndThemes,
		handleInstallThemeOrPlugin,
		getProgressStatus,
		getPluginStatus,
	} = usePluginsAndThemes();

	useEffect( () => {
		checkForGCError();
		fetchInstalledPluginsAndThemes();
	}, [] );

	const getErrorMessages = ( errorCode ) => {
		switch ( String( errorCode ) ) {
			case '400':
				return __(
					'The request is malformed or invalid. Please check the request parameters and try again.',
					'surerank'
				);
			case '401':
				return __(
					'Authentication failed. Please provide valid credentials or re-authenticate.',
					'surerank'
				);
			case '403':
				return __(
					'Access is denied. You lack the necessary permissions to perform this action.',
					'surerank'
				);
			case '404':
				return __(
					'The requested resource was not found. Please verify the URL or resource ID.',
					'surerank'
				);
			case '429':
				return __(
					'You have exceeded your API quota. Please wait or upgrade your plan.',
					'surerank'
				);
			case '500':
				return __(
					`A server error occurred on Google's end. Please try again later.`,
					'surerank'
				);
			default:
				return __( 'An error occurred. Please try again.', 'surerank' );
		}
	};

	const checkForGCError = () => {
		const link = 'https://developers.google.com/webmaster-tools/v1/errors';

		const params = new URLSearchParams( window.location.search );
		const errorCode = params.get( 'gcp_error_code' );
		if ( ! errorCode ) {
			return;
		}
		const errorMessage = getErrorMessages( errorCode );

		const content = (
			<div>
				<p>{ errorMessage }</p>
				<p>
					{ __( 'Error code: ', 'surerank' ) }
					{ errorCode }
				</p>
				<a
					href={ link }
					target="_blank"
					rel="noopener noreferrer"
					className="text-link-primary no-underline"
				>
					{ __( 'Learn more', 'surerank' ) }
				</a>
			</div>
		);

		if ( errorMessage ) {
			toast.error( content, {
				dangerouslySetInnerHTML: true,
				autoDismiss: false,
			} );
		}

		//remove error code parameter and navigate directly to search-console
		const url = new URL( window.location.href );
		url.searchParams.delete( 'gcp_error_code' );
		url.searchParams.delete( 'action' );
		url.searchParams.delete( 'nonce' );
		url.searchParams.delete( 'status' );
		window.history.replaceState( {}, '', url.toString() );
		navigate( { to: '/search-console' } );
	};

	const renderInstallButtonText = useCallback(
		( item ) => {
			const status = getPluginStatus( item );
			switch ( status ) {
				case 'active':
					return __( 'Activated', 'surerank' );
				case 'activate':
					return __( 'Activate', 'surerank' );
				default:
					return __( 'Install & Activate', 'surerank' );
			}
		},
		[ getPluginStatus ]
	);

	return (
		<>
			<Container
				className="h-full p-5 pb-8 xl:p-8 max-[1920px]:max-w-full mx-auto box-content bg-background-secondary gap-6"
				cols={ 12 }
				containerType="grid"
				gap="2xl"
			>
				<Container.Item className="col-span-8">
					<Container direction="column" className="gap-8 relative">
						<SiteSeoChecksSummary
							limit={ 10 }
							showViewAll={ true }
						/>
					</Container>
				</Container.Item>
				<Container.Item className="col-span-4 flex flex-col gap-6">
					{ /* Plugins and Themes */ }
					<Container
						className="w-full h-fit bg-background-primary border-0.5 border-solid rounded-xl border-border-subtle p-3 shadow-sm"
						containerType="flex"
						direction="column"
						gap="xs"
					>
						<Container.Item className="md:w-full lg:w-full">
							<Container
								align="center"
								className="p-1"
								gap="xs"
								justify="between"
							>
								<Label className="font-semibold text-text-primary">
									{ __( 'Extend Your Website', 'surerank' ) }
								</Label>
							</Container>
						</Container.Item>
						<Container.Item className="md:w-full lg:w-full bg-field-primary-background rounded-lg">
							<Container
								containerType="grid"
								className="p-1 gap-1 grid-cols-1 min-[425px]:grid-cols-2 md:grid-cols-2 xl:grid-cols-2"
							>
								{ SequencedThemesAndPlugins.map( ( item ) => (
									<PluginCard
										key={ item.name }
										item={ item }
										onInstall={ handleInstallThemeOrPlugin }
										fetchStatus={ fetchStatus }
										getPluginStatus={ getPluginStatus }
										getProgressStatus={ getProgressStatus }
										renderInstallButtonText={
											renderInstallButtonText
										}
									/>
								) ) }
							</Container>
						</Container.Item>
					</Container>

					{ /* Quick Access */ }
					<Container
						className="w-full h-fit bg-background-primary border-0.5 border-solid rounded-xl border-border-subtle p-3 shadow-sm"
						containerType="flex"
						direction="column"
						gap="xs"
					>
						<Container.Item className="md:w-full lg:w-full p-1">
							<Label className="font-semibold text-text-primary">
								{ __( 'Quick Access', 'surerank' ) }
							</Label>
						</Container.Item>
						<Container.Item className="flex flex-col md:w-full lg:w-full bg-field-primary-background gap-1 p-1 rounded-lg">
							{ quickAccessLinks.map( ( link ) => (
								<div
									key={ link.label }
									className="p-2 gap-1 items-center bg-background-primary rounded-md shadow-sm cursor-pointer"
									onClick={ () => {
										if ( link.external ) {
											window.open(
												link.link,
												'_blank',
												'noopener,noreferrer'
											);
										} else {
											window.location.href = link.link;
										}
									} }
								>
									<Container
										align="center"
										className="gap-1 p-1"
										containerType="flex"
										direction="row"
									>
										<Container.Item className="flex">
											{ link.icon }
										</Container.Item>
										<Container.Item className="flex">
											<Label className="py-0 px-1 font-normal cursor-pointer hover:text-link-primary">
												{ link.label }
											</Label>
										</Container.Item>
									</Container>
								</div>
							) ) }
						</Container.Item>
					</Container>
				</Container.Item>
			</Container>
		</>
	);
};

export default Dashboard;
