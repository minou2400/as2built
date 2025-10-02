import PageContentWrapper from '@AdminComponents/page-content-wrapper';
import { __ } from '@wordpress/i18n';
import { Button, toast } from '@bsf/force-ui';
import { useSuspenseSelect } from '@wordpress/data';
import { STORE_NAME } from '@AdminStore/constants';
import withSuspense from '@AdminComponents/hoc/with-suspense';
import { LoaderCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { Tooltip } from '@AdminComponents/tooltip';
import GeneratePageContent from '@Functions/page-content-generator';
import { cn } from '@/functions/utils';
import { createLazyRoute } from '@tanstack/react-router';
import { applyFilters } from '@wordpress/hooks';
import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

const xmlContent = [
	{
		type: 'switch',
		id: 'enable_xml_sitemap',
		storeKey: 'enable_xml_sitemap',
		dataType: 'boolean',
		label: __( 'Enable XML Sitemap', 'surerank' ),
		description: __(
			'Generates an XML sitemap to help search engines index your site content.',
			'surerank'
		),
	},
	{
		type: 'switch',
		id: 'enable_xml_image_sitemap',
		storeKey: 'enable_xml_image_sitemap',
		dataType: 'boolean',
		label: __( 'Include Images in XML Sitemap', 'surerank' ),
		description: __(
			'Add images from your posts and pages to the XML sitemap so search engines can find and index them more easily. Images are visible only in source code.',
			'surerank'
		),
		disabled: ( formValues ) => {
			return ! formValues.enable_xml_sitemap;
		},
	},
];

const xmlScreen = applyFilters(
	'surerank-pro.sitemap-settings',
	[
		{
			container: null,
			content: [
				{
					id: 'xml-settings',
					type: 'title',
					label: __( 'XML', 'surerank' ),
				},
			],
		},
		{
			container: null,
			content: xmlContent,
		},
	],
	xmlContent
);

export const PAGE_CONTENT = [
	//This is the very first depth of the form. And it represents the section container of the form.
	{
		container: {
			id: 'xml-settings-container',
			direction: 'column',
			gap: 6,
		},
		content: xmlScreen,
	},
];

const SiteMaps = () => {
	const { metaSettings } = useSuspenseSelect( ( select ) => {
		const { getMetaSettings } = select( STORE_NAME );
		return {
			metaSettings: getMetaSettings(),
		};
	}, [] );

	const SitemapButtons = () => {
		const [ isGenerating, setIsGenerating ] = useState( false );
		const isDisabled = ! metaSettings.enable_xml_sitemap;

		const generateCache = async () => {
			setIsGenerating( true );
			try {
				const result = await apiFetch( {
					path: '/surerank/v1/sitemap/generate-cache',
					method: 'POST',
				} );

				// Show success message (you might want to use a toast notification here)
				toast.warning( result.message, {
					description: result.description,
					icon: <LoaderCircle className="animate-spin" />,
				} );
			} catch ( error ) {
				toast.error(
					error.message ||
						__(
							'Error generating sitemap cache. Please try again.',
							'surerank'
						)
				);
			} finally {
				setIsGenerating( false );
			}
		};

		return (
			<>
				<Button
					variant="outline"
					size="md"
					className={ cn( 'min-w-fit flex items-center gap-2', {
						'cursor-not-allowed': isDisabled,
					} ) }
					disabled={ isDisabled || isGenerating }
					onClick={ generateCache }
					icon={
						<RefreshCw
							className={ cn( { 'animate-spin': isGenerating } ) }
						/>
					}
					iconPosition="right"
				/>
				<Tooltip
					className="max-w-[18rem]"
					content={
						isDisabled
							? __(
									'Sitemap is currently disabled. Please enable XML sitemap in settings to access the sitemap file.',
									'surerank'
							  )
							: ''
					}
					arrow
				>
					<Button
						variant="outline"
						size="md"
						className={ cn( 'min-w-fit flex items-center gap-2', {
							'cursor-not-allowed':
								! metaSettings.enable_xml_sitemap,
						} ) }
						disabled={ isDisabled }
						onClick={
							metaSettings.enable_xml_sitemap
								? () =>
										window.open(
											surerank_admin_common?.sitemap_url,
											'_blank',
											'noopener,noreferrer'
										)
								: undefined
						}
						icon={ <ExternalLink /> }
						iconPosition="right"
					>
						{ __( 'Open Sitemap', 'surerank' ) }
					</Button>
				</Tooltip>
			</>
		);
	};

	return (
		<PageContentWrapper
			title={ __( 'Sitemaps', 'surerank' ) }
			secondaryButton={ <SitemapButtons /> }
			description={ __(
				'Generates a sitemap to help search engines find and index your content more efficiently. Showing image count can improve how your media appears in search results.',
				'surerank'
			) }
		>
			<GeneratePageContent json={ PAGE_CONTENT } />
		</PageContentWrapper>
	);
};

export const LazyRoute = createLazyRoute( '/advanced/sitemaps' )( {
	component: withSuspense( SiteMaps ),
} );

export default withSuspense( SiteMaps );
